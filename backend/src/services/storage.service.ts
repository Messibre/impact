import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

/**
 * Any file storage code lives behind this interface, per spec section 2:
 * "any S3-compatible bucket ... or a local-disk stand-in behind the same
 * interface if no bucket is provisioned — keep it behind storage.service.ts
 * either way." Swap saveFile/deleteFile's internals for an S3 SDK client
 * without touching callers if a bucket gets provisioned later.
 */

const STORAGE_MODE = process.env.STORAGE_MODE || "local";
const LOCAL_DIR = process.env.STORAGE_LOCAL_DIR || "./uploads";

async function ensureLocalDir() {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
}

export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<{ url: string; key: string }> {
  if (STORAGE_MODE === "local") {
    await ensureLocalDir();
    const ext = path.extname(originalName);
    const key = `${uuid()}${ext}`;
    const filePath = path.join(LOCAL_DIR, key);
    await fs.writeFile(filePath, buffer);
    return { url: `/uploads/${key}`, key };
  }

  // SCOPE QUESTION: real S3 upload is not implemented here — wire in
  // @aws-sdk/client-s3 (or equivalent) using STORAGE_BUCKET_URL /
  // STORAGE_ACCESS_KEY / STORAGE_SECRET_KEY when a bucket is provisioned.
  throw new Error("Non-local storage mode is not configured yet.");
}

export async function deleteFile(key: string): Promise<void> {
  if (STORAGE_MODE === "local") {
    const filePath = path.join(LOCAL_DIR, key);
    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      // File deletion failing after DB rows are already deleted: log the
      // orphan for manual cleanup rather than failing the whole operation.
      console.error(`[storage.service] failed to delete orphaned file ${key}:`, err);
    }
    return;
  }

  throw new Error("Non-local storage mode is not configured yet.");
}

export function keyFromUrl(url: string): string {
  return path.basename(url);
}
