import { ethers } from "ethers";
import {
  EAS,
  SchemaEncoder,
  SchemaRegistry,
} from "@ethereum-attestation-service/eas-sdk";
import { easConfig, EAS_SCHEMA_DEFINITION } from "../config/eas.config";
import { ApiError } from "../utils/ApiError";

/**
 * ARCHITECTURE RULE (spec section 3): this is the ONLY file in the codebase
 * allowed to talk to the blockchain. No controller or other service may
 * import the EAS SDK, ethers, or eas.config.ts directly — go through the
 * two functions exported here.
 *
 * In particular, story.service.ts's `purgeStoryMedia` (off-chain story
 * deletion) must have ZERO import path to this file. If you're extending
 * purgeStoryMedia and find yourself reaching for something here, stop —
 * that's the one guardrail a reviewer will check first.
 */

let provider: ethers.JsonRpcProvider | null = null;
let signer: ethers.Wallet | null = null;
let eas: EAS | null = null;

function getEas(): EAS {
  if (eas) return eas;
  provider = new ethers.JsonRpcProvider(easConfig.rpcUrl);
  signer = new ethers.Wallet(easConfig.signerPrivateKey, provider);
  eas = new EAS(easConfig.easContractAddress);
  eas.connect(signer);
  return eas;
}

/**
 * Structurally impossible to pass personal data: this type only has the
 * five anonymized fields. Do not widen it. Personal data (name, voice
 * file, clip file, face) must never reach attestOnChain.
 */
export interface AttestPayload {
  region: string;
  milestoneDate: Date;
  sdgIndicator: string;
  coverageAmount?: number;
  mediaHash?: string;
  // Hash of the blurred workshop image. Optional — matches
  // Certificate.imageHash nullability. Only the hash goes on-chain, never
  // the image, its Cloudinary URL, or any asset id.
  imageHash?: string;
}

export interface AttestResult {
  attestationUID: string;
  txHash: string;
}

function encodePayload(payload: AttestPayload): string {
  const schemaEncoder = new SchemaEncoder(EAS_SCHEMA_DEFINITION);
  return schemaEncoder.encodeData([
    { name: "region", value: payload.region, type: "string" },
    {
      name: "milestoneDate",
      value: BigInt(Math.floor(payload.milestoneDate.getTime() / 1000)),
      type: "uint256",
    },
    { name: "sdgIndicator", value: payload.sdgIndicator, type: "string" },
    {
      // Edge case: coverageAmount may be undefined at first issuance —
      // encode as 0, never omit, so schema encoding doesn't break.
      name: "coverageAmount",
      value: BigInt(payload.coverageAmount ?? 0),
      type: "uint256",
    },
    {
      // Edge case: mediaHash won't exist until StoryMedia is created —
      // encode as zero bytes32, never omit.
      name: "mediaHash",
      value: payload.mediaHash ?? ethers.ZeroHash,
      type: "bytes32",
    },
    {
      // Optional: no image provided at issuance — encode as zero bytes32,
      // never omit, so schema encoding stays well-formed.
      name: "imageHash",
      value: payload.imageHash ?? ethers.ZeroHash,
      type: "bytes32",
    },
  ]);
}

async function attestOnce(payload: AttestPayload): Promise<AttestResult> {
  const easClient = getEas();
  const encodedData = encodePayload(payload);

  const tx = await easClient.attest({
    schema: easConfig.schemaUID,
    data: {
      recipient: ethers.ZeroAddress,
      expirationTime: BigInt(0),
      revocable: true,
      data: encodedData,
    },
  });

  const attestationUID = await tx.wait();
  const txHash = tx.receipt?.hash ?? "";

  return { attestationUID, txHash };
}

/**
 * Submits a transaction via the single server-side signer wallet.
 * Retries once, but only on timeout/network errors — never on revert
 * (a revert means bad input; retrying won't help).
 */
export async function attestOnChain(payload: AttestPayload): Promise<AttestResult> {
  try {
    return await attestOnce(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isNetworkOrTimeout =
      /timeout|network|ETIMEDOUT|ECONNRESET|fetch failed/i.test(message);

    if (isNetworkOrTimeout) {
      try {
        return await attestOnce(payload);
      } catch (retryErr: unknown) {
        throw mapAttestError(retryErr);
      }
    }

    // Distinct, clear error for insufficient signer balance — this will
    // happen during rehearsal, so don't bury it in a generic 502.
    if (/insufficient funds/i.test(message)) {
      throw new ApiError(
        502,
        "Signer wallet has insufficient Sepolia test ETH — fund it from a faucet and retry"
      );
    }

    throw mapAttestError(err);
  }
}

function mapAttestError(err: unknown): ApiError {
  return new ApiError(502, "On-chain attestation failed, please retry");
}

export interface DecodedAttestation {
  region: string;
  milestoneDate: Date;
  sdgIndicator: string;
  coverageAmount: number | null;
  mediaHash: string | null;
  imageHash: string | null;
}

/**
 * Read-only. Returns null if not found — caller (story.service.ts) maps
 * that to a 404. Only throws on genuine RPC/network failure so the
 * controller can distinguish "not found" from "temporarily unreachable".
 *
 * Note: an EAS Attestation record does not carry the hash of the
 * transaction that created it (that's not part of the on-chain struct),
 * so this deliberately does not return a txHash. Callers that need it
 * (storyView.service.ts) read Certificate.txHash from Prisma instead,
 * which was captured once at issuance time in admin.controller.ts.
 */
export async function getAttestation(
  attestationUID: string
): Promise<DecodedAttestation | null> {
  const easClient = getEas();

  let attestation;
  try {
    attestation = await easClient.getAttestation(attestationUID);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (/network|timeout|ECONNRESET|fetch failed/i.test(message)) {
      throw new ApiError(503, "Blockchain read temporarily unavailable, please retry");
    }
    throw err;
  }

  if (!attestation || attestation.uid === ethers.ZeroHash) {
    return null;
  }

  try {
    const schemaEncoder = new SchemaEncoder(EAS_SCHEMA_DEFINITION);
    const decoded = schemaEncoder.decodeData(attestation.data);

    const get = (name: string) => decoded.find((d) => d.name === name)?.value.value;

    return {
      region: String(get("region") ?? ""),
      milestoneDate: new Date(Number(get("milestoneDate") ?? 0) * 1000),
      sdgIndicator: String(get("sdgIndicator") ?? ""),
      coverageAmount:
        get("coverageAmount") !== undefined ? Number(get("coverageAmount")) : null,
      mediaHash: (get("mediaHash") as string) || null,
      // Zero bytes32 sentinel (see encodePayload) maps back to null.
      imageHash:
        ((get("imageHash") as string) || null) === ethers.ZeroHash
          ? null
          : (get("imageHash") as string) || null,
    };
  } catch {
    // Attestation exists but doesn't decode against our schema
    // (e.g. wrong schema UID) — decode defensively, return null.
    return null;
  }
}
