import "dotenv/config";
import { getAddress, isAddress } from "ethers";

// Canonical EAS v0.26 deployment addresses on Sepolia. These are fixed,
// well-known public constants; used as a safe fallback if an env value is
// missing or malformed (e.g. a truncated address that fails checksum).
// Stored lowercase so getAddress() computes the correct EIP-55 checksum
// itself, rather than validating a hand-typed mixed-case string.
const SEPOLIA_EAS_CONTRACT = "0xc2679fbd37d54388ce493f1db75320d236e18157";
const SEPOLIA_SCHEMA_REGISTRY = "0x0a7e2ff54e76b8e6659aedc9103fb21c038050d0";

// Resolve an address from an env var, falling back to a known-good default
// when the provided value is absent or not a valid Ethereum address.
function resolveAddress(
  raw: string | undefined,
  fallback: string,
  label: string
): string {
  if (raw && isAddress(raw)) {
    return getAddress(raw); // normalize to checksummed form
  }
  if (raw) {
    // Value was provided but invalid (wrong length / bad checksum). Warn loudly
    // and use the canonical address so attestation doesn't silently target the
    // wrong contract and revert with ResolverNotFound.
    console.warn(
      `[eas.config] ${label}="${raw}" is not a valid address; ` +
        `falling back to canonical Sepolia address ${fallback}`
    );
  }
  return getAddress(fallback);
}

// Central place for EAS/Sepolia config. Only chain.service.ts should import this.
export const easConfig = {
  rpcUrl: process.env.SEPOLIA_RPC_URL as string,
  signerPrivateKey: process.env.SIGNER_PRIVATE_KEY as string,
  easContractAddress: resolveAddress(
    process.env.EAS_CONTRACT_ADDRESS,
    SEPOLIA_EAS_CONTRACT,
    "EAS_CONTRACT_ADDRESS"
  ),
  schemaRegistryAddress: resolveAddress(
    process.env.EAS_SCHEMA_REGISTRY_ADDRESS,
    SEPOLIA_SCHEMA_REGISTRY,
    "EAS_SCHEMA_REGISTRY_ADDRESS"
  ),
  schemaUID: process.env.EAS_SCHEMA_UID as string,
  network: "sepolia" as const,
};

// The exact schema string registered once via scripts/registerSchema.ts.
// Leave a visible marker for where the pending image field will be inserted.
export const EAS_SCHEMA_DEFINITION =
  "string region,uint256 milestoneDate,string sdgIndicator,uint256 coverageAmount,bytes32 mediaHash" +
  // SCOPE-EXTEND: blurred workshop image hash added by the follow-up spec.
  // Appended at the end so field order stays stable. NOTE: adding a field
  // means this is a NEW immutable schema — re-register via
  // `npm run eas:register-schema` and set the new UID in EAS_SCHEMA_UID.
  ",bytes32 imageHash";
