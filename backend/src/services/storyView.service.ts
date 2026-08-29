import { prisma } from "../utils/prisma";
import { getAttestation } from "./chain.service";

interface PersonRow {
  id: string;
  name: string;
  role: string | null;
  consentPublic: boolean;
}

/**
 * Deliberately kept separate from story.service.ts. This is the only
 * off-chain-facing service allowed to call chain.service.ts (read-only,
 * via getAttestation), which keeps story.service.ts — home of
 * purgeStoryMedia — free of any import path to the chain layer.
 */

export interface StoryViewDTO {
  certificate: {
    id: string;
    region: string;
    milestoneDate: string;
    sdgIndicator: string;
    coverageAmount: number | null;
    txHash: string;
    chainNetwork: string;
    // Blurred workshop image (off-chain Cloudinary URL). null when none was
    // attached at issuance. The unblurred original is never stored, so this
    // URL is always safe to serve publicly.
    certificateImageUrl: string | null;
  };
  story: {
    generatedClipUrl: string | null;
    generatedPageContent: string | null;
    milestoneText: string;
    // NOTE(scope-extend): `id` added alongside name/role so the founder
    // dashboard (same GET /story call, just with a founder token attached
    // by the frontend elsewhere) has a real Person id to send back to
    // PATCH /consent — without it, consent toggling has nothing to key
    // off. Doesn't widen what's exposed for private people; they're still
    // filtered out entirely below.
    visiblePeople: { id: string; name: string; role: string | null }[];
  };
  storyStatus: "generating" | "ready" | "not_started";
}

export async function assembleStoryView(certificateId: string): Promise<StoryViewDTO | null> {
  // Prefer failing the whole response over showing story content with no
  // certificate proof — the certificate is the trust anchor.
  const [certificate, onChain] = await Promise.all([
    prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { storyMedia: { include: { people: true } } },
    }),
    getAttestation(certificateId),
  ]);

  if (!certificate || !onChain) {
    return null;
  }

  const storyMedia = certificate.storyMedia;

  if (!storyMedia) {
    return {
      certificate: toCertificateDTO(certificate, onChain),
      story: {
        generatedClipUrl: null,
        generatedPageContent: null,
        milestoneText: "",
        visiblePeople: [],
      },
      storyStatus: "not_started",
    };
  }

  // CONSENT ENFORCEMENT (spec section 8): re-check consentPublic fresh on
  // every single call. Never bake this into a pre-rendered/cached artifact.
  // If a person's consent is currently false, they are absent from the
  // response, full stop — no placeholder, no hint they were removed.
  const visiblePeople = storyMedia.people
    .filter((p: PersonRow) => p.consentPublic === true)
    .map((p: PersonRow) => ({ id: p.id, name: p.name, role: p.role }));

  const anyPrivatePerson = storyMedia.people.some((p: PersonRow) => p.consentPublic === false);
  const clipGenerated = Boolean(storyMedia.generatedClipUrl);

  // If the only generated clip has a private person in it, withhold
  // generatedClipUrl entirely from the public response — don't attempt
  // selective blurring/muting (out of scope). Certificate info + any
  // remaining public people/milestone text is still shown.
  const shouldWithholdClip = anyPrivatePerson && storyMedia.people.length > 0;

  const storyStatus: StoryViewDTO["storyStatus"] = clipGenerated ? "ready" : "generating";

  return {
    certificate: toCertificateDTO(certificate, onChain),
    story: {
      generatedClipUrl: shouldWithholdClip ? null : storyMedia.generatedClipUrl,
      generatedPageContent: storyMedia.generatedPageSlug
        ? `/p/${storyMedia.generatedPageSlug}`
        : null,
      milestoneText: storyMedia.milestoneText,
      visiblePeople,
    },
    storyStatus,
  };
}

function toCertificateDTO(
  certificate: {
    id: string;
    sdgIndicator: string;
    milestoneDate: Date;
    chainNetwork: string;
    txHash: string;
    certificateImageUrl: string | null;
  },
  onChain: NonNullable<Awaited<ReturnType<typeof getAttestation>>>
) {
  return {
    id: certificate.id,
    region: onChain.region,
    milestoneDate: certificate.milestoneDate.toISOString(),
    sdgIndicator: certificate.sdgIndicator,
    coverageAmount: onChain.coverageAmount,
    // txHash comes from Prisma, not the on-chain read — see the comment
    // on chain.service.ts's getAttestation for why: an Attestation struct
    // doesn't carry the hash of the tx that created it.
    txHash: certificate.txHash,
    chainNetwork: certificate.chainNetwork,
    // Off-chain: the blurred image URL is not part of the attestation, only
    // its hash (onChain.imageHash) is. We surface the URL for display; a
    // verifier can re-hash the fetched image and compare to onChain.imageHash.
    certificateImageUrl: certificate.certificateImageUrl,
  };
}
