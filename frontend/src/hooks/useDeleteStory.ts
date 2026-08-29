import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "../lib/axios";

export function useDeleteStory(certificateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.delete<ApiEnvelope<{ certificateId: string; onChainRecordUntouched: boolean }>>(
        `/certificates/${certificateId}/story`
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story", certificateId] });
    },
  });
}
