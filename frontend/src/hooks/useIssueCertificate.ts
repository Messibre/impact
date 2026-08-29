import { useMutation } from "@tanstack/react-query";
import { api, ApiEnvelope } from "../lib/axios";

interface IssueCertificateInput {
  workshopName: string;
  region: string;
  sdgIndicator: string;
  milestoneDate: string;
  coverageAmount?: number;
  // Optional workshop photo. Blurred + hashed server-side before it is ever
  // persisted; only the blurred version's URL and hash leave the backend.
  image?: File | null;
  adminToken: string;
}

interface IssueCertificateResponse {
  certificateId: string;
  txHash: string;
  qrUrl: string;
  founderPassword: string;
  // Blurred Cloudinary secure_url, present only when an image was uploaded.
  certificateImageUrl?: string | null;
}

export function useIssueCertificate() {
  return useMutation({
    mutationFn: async (input: IssueCertificateInput) => {
      const { adminToken, image, ...body } = input;

      // Send multipart so the optional image rides alongside the JSON fields.
      // The backend reads text fields off req.body and the file off req.file.
      const formData = new FormData();
      formData.append("workshopName", body.workshopName);
      formData.append("region", body.region);
      formData.append("sdgIndicator", body.sdgIndicator);
      formData.append("milestoneDate", body.milestoneDate);
      if (body.coverageAmount != null) {
        formData.append("coverageAmount", String(body.coverageAmount));
      }
      if (image) {
        formData.append("image", image);
      }

      const res = await api.post<ApiEnvelope<IssueCertificateResponse>>("/admin/certificates", formData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      return res.data.data;
    },
  });
}
