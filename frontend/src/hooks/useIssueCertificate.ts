import { useMutation } from "@tanstack/react-query";
import { api, ApiEnvelope } from "../lib/axios";

interface IssueCertificateInput {
  workshopName: string;
  region: string;
  sdgIndicator: string;
  milestoneDate: string;
  coverageAmount?: number;
  adminToken: string;
}

interface IssueCertificateResponse {
  certificateId: string;
  txHash: string;
  qrUrl: string;
  founderPassword: string;
}

export function useIssueCertificate() {
  return useMutation({
    mutationFn: async (input: IssueCertificateInput) => {
      const { adminToken, ...body } = input;
      const res = await api.post<ApiEnvelope<IssueCertificateResponse>>("/admin/certificates", body, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      return res.data.data;
    },
  });
}
