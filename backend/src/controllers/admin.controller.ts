import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendResponse } from "../utils/ApiResponse";
import { issueCertificateSchema } from "../schemas/certificate.schema";
import { attestOnChain } from "../services/chain.service";
import { createFounderCredentials } from "../services/auth.service";
import { prisma } from "../utils/prisma";

export const issueCertificate = asyncHandler(async (req: Request, res: Response) => {
  const body = issueCertificateSchema.parse(req.body);

  // Certificate.mediaHash/txHash are populated only after attest()
  // succeeds — don't create a Certificate row before the on-chain
  // transaction confirms.
  const { attestationUID, txHash } = await attestOnChain({
    region: body.region,
    milestoneDate: body.milestoneDate,
    sdgIndicator: body.sdgIndicator,
    coverageAmount: body.coverageAmount,
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
    },
  });

  const { plaintextPassword } = await createFounderCredentials(founder.id);

  const qrUrl = `${process.env.PUBLIC_APP_BASE_URL}/story/${attestationUID}`;

  sendResponse(res, 201, "Certificate issued on-chain", {
    certificateId: attestationUID,
    txHash,
    qrUrl,
    founderPassword: plaintextPassword,
  });
});
