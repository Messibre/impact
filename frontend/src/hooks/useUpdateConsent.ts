import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "../lib/axios";
import { StoryViewDTO } from "./useStory";

interface ConsentUpdate {
  id: string;
  consentPublic: boolean;
}

// Wraps PATCH .../consent with an optimistic update + rollback-on-error,
// then invalidates useStory so the manage-consent UI and any open story
// preview reflect the change immediately (this is FR-15's frontend half —
// don't skip the invalidateQueries call below, and don't add caching that
// bypasses it).
export function useUpdateConsent(certificateId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["story", certificateId];

  return useMutation({
    mutationFn: async (updates: ConsentUpdate[]) => {
      const res = await api.patch<ApiEnvelope<{ updated: ConsentUpdate[] }>>(
        `/certificates/${certificateId}/consent`,
        { people: updates }
      );
      return res.data.data.updated;
    },
    // Optimistic switch state is handled locally in PersonConsentRow (it
    // flips immediately on click). Here we just snapshot the query cache
    // so onError can roll back to a known-good state; the authoritative
    // visiblePeople list always comes from the refetch in onSettled.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StoryViewDTO>(queryKey);
      return { previous };
    },
    onError: (_err, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
