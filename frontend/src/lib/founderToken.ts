// Stores/retrieves the scoped founder token, keyed per certificateId, since
// a token for one certificate must never be sent for another.
const keyFor = (certificateId: string) => `founder_token_${certificateId}`;

export function setFounderToken(certificateId: string, token: string) {
  sessionStorage.setItem(keyFor(certificateId), token);
}

export function getFounderToken(certificateId: string): string | null {
  return sessionStorage.getItem(keyFor(certificateId));
}

export function clearFounderToken(certificateId: string) {
  sessionStorage.removeItem(keyFor(certificateId));
}
