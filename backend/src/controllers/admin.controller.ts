import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/ApiResponse";
import { issueCertificateSchema } from "../schemas/certificate.schema";
import { attestOnChain } from "../services/chain.service";
import { uploadCertificateImage } from "../services/image.service";
import { createFounderCredentials } from "../services/auth.service";
import { prisma } from "../utils/prisma";

export const issueCertificate = asyncHandler(async (req: Request, res: Response) => {
  const body = issueCertificateSchema.parse(req.body);

  // Optional blurred workshop image. If provided, blur + upload to Cloudinary
  // and hash the blurred bytes BEFORE attesting, so the hash lands on-chain
  // in the same attestation. If absent, both fields stay null — image is
  // optional and never blocks issuance.
  const imageFile = req.file;
  let certificateImageUrl: string | null = null;
  let imageHash: string | null = null;
  if (imageFile) {
    const uploaded = await uploadCertificateImage(imageFile.buffer);
    certificateImageUrl = uploaded.url;
    imageHash = uploaded.hash;
  }

  // Certificate.mediaHash/txHash are populated only after attest()
  // succeeds — don't create a Certificate row before the on-chain
  // transaction confirms.
  const { attestationUID, txHash } = await attestOnChain({
    region: body.region,
    milestoneDate: body.milestoneDate,
    sdgIndicator: body.sdgIndicator,
    coverageAmount: body.coverageAmount,
    imageHash: imageHash ?? undefined,
  });

  const founder = await prisma.founder.create({
    data: {
      workshopName: body.workshopName,
      region: body.region,
      passwordHash: "placeholder", // overwritten immediately below
    },
  });

  await prisma.certificate.create({
    data: {
      id: attestationUID, // = EAS attestation UID, not auto-generated
      founderId: founder.id,
      sdgIndicator: body.sdgIndicator,
      milestoneDate: body.milestoneDate,
      coverageAmount: body.coverageAmount,
      txHash,
      certificateImageUrl,
      imageHash,
    },
  });

  const { plaintextPassword } = await createFounderCredentials(founder.id);

  const qrUrl = `${process.env.PUBLIC_APP_BASE_URL}/story/${attestationUID}`;

  sendResponse(res, 201, "Certificate issued on-chain", {
    certificateId: attestationUID,
    txHash,
    qrUrl,
    founderPassword: plaintextPassword,
    certificateImageUrl,
    imageHash,
  });
});
