import { createHash } from "crypto";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary.config";
import { ApiError } from "../utils/ApiError";

/**
 * ARCHITECTURE RULE (mirrors chain.service.ts): this is the ONLY file in the
 * codebase allowed to talk to Cloudinary. No controller or other service may
 * import the Cloudinary SDK or cloudinary.config.ts directly — go through
 * uploadCertificateImage below.
 *
 * PRIVACY GUARANTEE: the blur is applied as an INCOMING transformation, so
 * Cloudinary stores the already-blurred asset — the unblurred original is
 * never persisted or served at any URL, even temporarily. Faces caught in
 * frame are unrecognizable before the bytes ever land.
 */

// Strong blur — tuned so incidental faces are unrecognizable. Cloudinary's
// blur effect strength ranges 1–2000; we use the max.
const BLUR_TRANSFORMATION = [{ effect: "blur:2000" }, { quality: "auto" }];

function uploadBlurred(fileBuffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "proof-of-impact/certificates",
        resource_type: "image",
        // Incoming transformation: modifies the stored original itself, so
        // the unblurred version is never kept.
        transformation: BLUR_TRANSFORMATION,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload returned no result"));
        }
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

/**
 * Uploads a certificate image to Cloudinary as a blurred asset and returns
 * its secure_url plus a SHA-256 hash of the blurred bytes (for the on-chain
 * imageHash field). The hash is computed from the actually-stored blurred
 * image, not the input buffer, so it matches what viewers can see.
 */
export async function uploadCertificateImage(
  fileBuffer: Buffer
): Promise<{ url: string; hash: string }> {
  let result: UploadApiResponse;
  try {
    result = await uploadBlurred(fileBuffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ApiError(502, `Certificate image upload failed: ${message}`);
  }

  const url = result.secure_url;

  // Hash the blurred bytes as delivered from Cloudinary, so imageHash is a
  // hash of exactly what's stored and shown — never the unblurred input.
  let hash: string;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`fetch ${url} -> ${response.status}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    hash = "0x" + createHash("sha256").update(bytes).digest("hex");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ApiError(502, `Failed to hash blurred certificate image: ${message}`);
  }

  return { url, hash };
}
