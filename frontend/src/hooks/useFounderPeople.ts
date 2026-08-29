import { useQuery } from "@tanstack/react-query";
import { api, ApiEnvelope } from "../lib/axios";

export interface FounderPerson {
  id: string;
  name: string;
  role: string | null;
  consentPublic: boolean;
}

// Founder-scoped roster read. Unlike useStory (which hits the public
// GET /story and only ever returns currently-public people), this hits the
// authenticated GET /certificates/:certificateId/people endpoint and returns
// EVERY person regardless of consent state. This is what makes toggling a
// private person back to public work — they never disappear from this list.
// Keep this separate from useStory; do not merge them.
export function useFounderPeople(certificateId: string) {
  return useQuery({
    queryKey: ["founder-people", certificateId],
    enabled: certificateId.length > 0,
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ people: FounderPerson[] }>>(
        `/certificates/${certificateId}/people`
      );
      return res.data.data.people;
    },
  });
}
