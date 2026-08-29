import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../utils/prisma";
import { ApiError } from "../utils/ApiError";
import { signFounderToken } from "../utils/jwt";

const SALT_ROUNDS = 10;
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

// In-memory rate limit store, keyed per certificateId (spec: "not globally").
// Fine for a single-instance hackathon demo; swap for Redis if this ever
// runs across multiple processes.
const failedAttempts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(certificateId: string): boolean {
  const entry = failedAttempts.get(certificateId);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > WINDOW_MS) {
    failedAttempts.delete(certificateId);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(certificateId: string) {
  const entry = failedAttempts.get(certificateId);
  if (!entry || Date.now() - entry.windowStart > WINDOW_MS) {
    failedAttempts.set(certificateId, { count: 1, windowStart: Date.now() });
  } else {
    entry.count += 1;
  }
}

function clearFailures(certificateId: string) {
  failedAttempts.delete(certificateId);
}

export async function authenticateFounder(
  certificateId: string,
  password: string
): Promise<{ token: string; expiresIn: number }> {
  if (isRateLimited(certificateId)) {
    throw new ApiError(429, "Too many attempts, try again later");
  }

  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { founder: true },
  });

  // Certificate issued on-chain but no Founder row yet, or certificate
  // doesn't exist at all — both are 404, not a crash.
  if (!certificate || !certificate.founder) {
    throw new ApiError(404, "Certificate not found");
  }

  const passwordMatches = await bcrypt.compare(password, certificate.founder.passwordHash);

  if (!passwordMatches) {
    recordFailure(certificateId);
    throw new ApiError(401, "Invalid credentials");
  }

  clearFailures(certificateId);
  return signFounderToken({ certificateId });
}

/**
 * Generates a random password for a newly issued certificate's founder.
 * The plaintext is returned exactly once — this is the only place in the
 * codebase this value exists outside its bcrypt hash. Never log it.
 */
export async function createFounderCredentials(
  founderId: string
): Promise<{ plaintextPassword: string }> {
  const founder = await prisma.founder.findUnique({ where: { id: founderId } });
  if (!founder) {
    throw new ApiError(404, "Founder not found");
  }

  // ~8 alphanumeric chars: short enough to type on a phone in the field.
  // Known simplification for hackathon scope, not a high-entropy secret.
  const plaintextPassword = crypto
    .randomBytes(6)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 8);

  const passwordHash = await bcrypt.hash(plaintextPassword, SALT_ROUNDS);

  await prisma.founder.update({
    where: { id: founderId },
    data: { passwordHash },
  });

  return { plaintextPassword };
}
