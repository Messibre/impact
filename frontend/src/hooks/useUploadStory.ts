import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiEnvelope } from "../lib/axios";

export interface PersonFormRow {
  name: string;
  role?: string;
  consentPublic: boolean;
}

interface UploadStoryInput {
  voice: File;
  clip: File;
  milestoneText: string;
  people: PersonFormRow[];
}

interface UploadStoryResponse {
  storyMediaId: string;
  certificateId: string;
  status: string;
}

export function useUploadStory(certificateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadStoryInput) => {
      const formData = new FormData();
      formData.append("voice", input.voice);
      formData.append("clip", input.clip);
      formData.append("milestoneText", input.milestoneText);
      formData.append("people", JSON.stringify(input.people));

      const res = await api.post<ApiEnvelope<UploadStoryResponse>>(
        `/certificates/${certificateId}/story`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["story", certificateId] });
    },
  });
}
