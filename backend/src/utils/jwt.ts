import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN_SECONDS || 3600);

export interface FounderTokenPayload {
  certificateId: string;
}

export function signFounderToken(payload: FounderTokenPayload): { token: string; expiresIn: number } {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
  return { token, expiresIn: EXPIRES_IN };
}

export function verifyFounderToken(token: string): FounderTokenPayload {
  return jwt.verify(token, JWT_SECRET) as FounderTokenPayload;
}
