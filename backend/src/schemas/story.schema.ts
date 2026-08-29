import { z } from "zod";

// NO-DEFAULT-CONSENT GUARDRAIL: consentPublic has no `.default()` and is
// required on every person object. A missing value fails validation here
// before it ever reaches the database.
export const personSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  consentPublic: z.boolean({
    required_error: "Consent must be explicitly set for every tagged person",
    invalid_type_error: "Consent must be explicitly set for every tagged person",
  }),
});

export const uploadStorySchema = z.object({
  milestoneText: z.string().min(5),
  people: z.array(personSchema).default([]),
});

export const consentUpdateSchema = z.object({
  people: z
    .array(
      z.object({
        id: z.string().uuid(),
        consentPublic: z.boolean(),
      })
    )
    .min(1),
});
