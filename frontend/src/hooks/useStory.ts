import { useQuery } from "@tanstack/react-query";
import { api, ApiEnvelope } from "../lib/axios";

export interface StoryViewDTO {
  certificate: {
    id: string;
    region: string;
    milestoneDate: string;
    sdgIndicator: string;
    coverageAmount: number | null;
    txHash: string;
    chainNetwork: string;
    // Blurred workshop photo (Cloudinary). Public/anonymized by definition,
    // so it needs no consent check. Null when no image was issued.
    certificateImageUrl: string | null;
  };
  story: {
    generatedClipUrl: string | null;
    generatedPageContent: string | null;
    milestoneText: string;
    visiblePeople: { id: string; name: string; role: string | null }[];
  };
  storyStatus: "generating" | "ready" | "not_started";
}

// Polls every few seconds while the story is still generating.
export function useStory(certificateId: string) {
  return useQuery({
    queryKey: ["story", certificateId],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<StoryViewDTO>>(`/story/${certificateId}`);
      return res.data.data;
    },
    refetchInterval: (query) => (query.state.data?.storyStatus === "generating" ? 4000 : false),
    enabled: Boolean(certificateId),
  });
}
