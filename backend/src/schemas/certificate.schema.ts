import { z } from "zod";

export const issueCertificateSchema = z.object({
  workshopName: z.string().min(1),
  region: z.string().min(1),
  sdgIndicator: z.string().min(1),
  milestoneDate: z.coerce.date(),
  coverageAmount: z.number().int().positive().optional(),
});
