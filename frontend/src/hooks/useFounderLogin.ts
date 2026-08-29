import { useMutation } from "@tanstack/react-query";
import { api, ApiEnvelope } from "../lib/axios";
import { setFounderToken } from "../lib/founderToken";

interface LoginResponse {
  token: string;
  certificateId: string;
  expiresIn: number;
}

export function useFounderLogin() {
  return useMutation({
    mutationFn: async ({ certificateId, password }: { certificateId: string; password: string }) => {
      const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/founder-login", {
        certificateId,
        password,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setFounderToken(data.certificateId, data.token);
    },
  });
}
