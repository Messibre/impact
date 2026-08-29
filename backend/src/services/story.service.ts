import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/ApiError";
import { deleteFile, keyFromUrl } from "./storage.service";
import { generateArtifacts } from "./generator.service";

// Minimal shape of the transaction client used below — avoids depending
// on Prisma's generated `Prisma.TransactionClient` type directly, which
// keeps this file typecheckable even before `prisma generate` has run.
interface TxClient {
  person: {
    update: (args: { where: { id: string }; data: { consentPublic: boolean } }) => Promise<{
      id: string;
      consentPublic: boolean;
    }>;
  };
  storyMedia: {
    update: (args: { where: { certificateId: string }; data: { updatedAt: Date } }) => Promise<unknown>;
  };
}

/**
 * IMPORTANT — architecture guardrail (spec section 3):
 * This file must NEVER import chain.service.ts, directly or indirectly.
 * purgeStoryMedia (off-chain deletion) lives here specifically so that
 * fact is structurally checkable: grep this file's imports and you will
 * never find chain.service.ts. The read-side function that DOES need an
 * on-chain lookup (assembleStoryView) lives in storyView.service.ts
 * instead, precisely to keep that import out of this file.
 */

export interface PersonInput {
  name: string;
  role?: string;
  consentPublic: boolean;
}

export async function createStoryMedia(
  certificateId: string,
  voiceUrl: string,
  clipUrl: string,
  milestoneText: string,
  people: PersonInput[]
) {
  const existing = await prisma.storyMedia.findUnique({ where: { certificateId } });
  if (existing) {
    throw new ApiError(409, "Story already exists for this certificate");
  }

  // NO-DEFAULT-CONSENT GUARDRAIL: every person must have consentPublic
  // explicitly present as a boolean. Missing/undefined is a validation
  // error, never an implicit "yes". (Also enforced in story.schema.ts
  // via Zod before this ever runs — this is the belt-and-braces check.)
  for (const person of people) {
    if (typeof person.consentPublic !== "boolean") {
      throw new ApiError(400, "Consent must be explicitly set for every tagged person");
    }
  }

  const storyMedia = await prisma.storyMedia.create({
    data: {
      certificateId,
      voiceUrl,
      clipUrl,
      milestoneText,
      people: {
        // people array may legitimately be empty (machines-only footage).
        // Duplicate names are allowed — consent is tracked per row, not per name.
        create: people.map((p) => ({
          name: p.name,
          role: p.role,
          consentPublic: p.consentPublic,
        })),
      },
    },
    include: { people: true },
  });

  // If generation fails after the raw upload succeeds, don't roll back
  // the StoryMedia write — the raw upload succeeding is independently
  // valuable. Fire-and-forget; errors are logged, not thrown to the caller,
  // since the controller has already responded 201.
  generateArtifacts(storyMedia.id).catch((err) => {
    console.error(`[story.service] generateArtifacts failed for ${storyMedia.id}:`, err);
  });

  return storyMedia;
}

/**
 * Founder-scoped roster read. Returns EVERY Person tied to this
 * certificate's StoryMedia regardless of consentPublic — this is what the
 * founder dashboard uses to toggle people back on after they were set
 * private. It is NOT a violation of the public "no hint of removal" rule
 * (spec section 8): the route is authenticated and scoped to the founder
 * who owns this data. Keep this separate from assembleStoryView, whose
 * public output must stay consent-filtered.
 */
export async function listCertificatePeople(
  certificateId: string
): Promise<{ id: string; name: string; role: string | null; consentPublic: boolean }[]> {
  const storyMedia = await prisma.storyMedia.findUnique({
    where: { certificateId },
    include: { people: true },
  });

  if (!storyMedia) {
    throw new ApiError(404, "No story found");
  }

  return storyMedia.people.map(
    (p: { id: string; name: string; role: string | null; consentPublic: boolean }) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      consentPublic: p.consentPublic,
    })
  );
}

export async function setPersonConsent(
  certificateId: string,
  updates: { id: string; consentPublic: boolean }[]
): Promise<{ id: string; consentPublic: boolean }[]> {
  const storyMedia = await prisma.storyMedia.findUnique({
    where: { certificateId },
    include: { people: true },
  });

  if (!storyMedia) {
    throw new ApiError(404, "Person not found");
  }

  const validIds = new Set(storyMedia.people.map((p: { id: string }) => p.id));

  // Reject the whole batch if any id doesn't belong to this certificate's
  // StoryMedia — no partial writes, to avoid a founder token flipping
  // another certificate's consent by guessing a Person id.
  for (const update of updates) {
    if (!validIds.has(update.id)) {
      throw new ApiError(404, "Person not found");
    }
  }

  const results: { id: string; consentPublic: boolean }[] = [];
  await prisma.$transaction(async (tx: TxClient) => {
    for (const update of updates) {
      const updated = await tx.person.update({
        where: { id: update.id },
        data: { consentPublic: update.consentPublic },
      });
      results.push({ id: updated.id, consentPublic: updated.consentPublic });
    }
    // Bump StoryMedia.updatedAt so anything watching that timestamp sees
    // the change; assembleStoryView itself always reads fresh regardless.
    await tx.storyMedia.update({
      where: { certificateId },
      data: { updatedAt: new Date() },
    });
  });

  return results;
}

/**
 * Deletes all off-chain story content for a certificate. Leaves the
 * on-chain Certificate row (txHash, mediaHash) completely untouched —
 * this function has no import path to chain.service.ts at all, enforced
 * structurally by this file's import list, not just by convention.
 */
export async function purgeStoryMedia(certificateId: string): Promise<void> {
  const storyMedia = await prisma.storyMedia.findUnique({
    where: { certificateId },
    include: { people: true },
  });

  if (!storyMedia) {
    throw new ApiError(404, "No story found");
  }

  // FR-17 trust guarantee: read Certificate's chain-derived fields before
  // and after this operation and assert they're byte-for-byte identical.
  const before = await prisma.certificate.findUnique({
    where: { id: certificateId },
    select: { txHash: true, mediaHash: true },
  });

  const fileKeys = [keyFromUrl(storyMedia.voiceUrl), keyFromUrl(storyMedia.clipUrl)];
  if (storyMedia.generatedClipUrl) fileKeys.push(keyFromUrl(storyMedia.generatedClipUrl));

  // Cascading delete IS allowed here: StoryMedia -> Person only.
  await prisma.storyMedia.delete({ where: { certificateId } });

  for (const key of fileKeys) {
    await deleteFile(key);
  }

  const after = await prisma.certificate.findUnique({
    where: { id: certificateId },
    select: { txHash: true, mediaHash: true },
  });

  const unchanged = before?.txHash === after?.txHash && before?.mediaHash === after?.mediaHash;
  console.log(
    `[story.service] purgeStoryMedia trust-guarantee check for ${certificateId}: ` +
      `Certificate.txHash/mediaHash unchanged = ${unchanged}`
  );
  if (!unchanged) {
    // This should be structurally impossible since this function never
    // touches the Certificate row — but log loudly if it ever isn't true.
    console.error(
      `[story.service] CRITICAL: Certificate fields changed during purgeStoryMedia for ${certificateId}`
    );
  }
}
