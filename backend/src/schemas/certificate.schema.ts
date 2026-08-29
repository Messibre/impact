import { z } from "zod";

export const issueCertificateSchema = z.object({
  workshopName: z.string().min(1),
  region: z.string().min(1),
  sdgIndicator: z.string().min(1),
  milestoneDate: z.coerce.date(),
  // Coerced from string so this works whether the request comes as JSON or
  // as multipart form-data (which it now can, when an image is attached).
  // An empty/absent value stays undefined rather than coercing to 0.
  coverageAmount: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().positive().optional()
  ),
});
