# Proof of Impact People Can See

Full-stack scaffold built from the spec: Express/TypeScript/Prisma backend +
React/TypeScript/Vite frontend, EAS attestations on Sepolia, off-chain
consent-gated story content.

## What's real vs. what needs your keys

This is a complete, structurally-correct implementation of everything in the
build prompt — but two things need **your own credentials** before it will
actually run end-to-end, since I can't create a funded testnet wallet or an
Alchemy/Infura account on your behalf:

1. **Sepolia RPC + signer wallet.** Get a free RPC URL (Alchemy/Infura),
   create a throwaway wallet, and fund it from a Sepolia faucet
   (e.g. `sepoliafaucet.com`). Put the RPC URL and the wallet's private key
   into `backend/.env`.
2. **EAS schema registration (one-time).** Run
   `npm run eas:register-schema` from `backend/` after step 1 — it prints a
   schema UID, which you paste into `EAS_SCHEMA_UID` in `.env`.

Everything else — the Express app, Prisma models, the chain/off-chain
firewall, consent enforcement, the ffmpeg pipeline, all four React pages —
is implemented and ready to run once those two things are in place.

## Setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, Sepolia RPC/key, JWT_SECRET, ADMIN_TOKEN
npm install
npx prisma migrate dev --name init
npm run eas:register-schema   # one-time; paste the printed UID into .env
npm run dev
```
Requires a running PostgreSQL instance (`DATABASE_URL`) and, for the
generator pipeline, `ffmpeg` installed and on your `PATH`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Vite proxies `/api` and `/uploads` to `http://localhost:4000` in dev
(`vite.config.ts`) — no separate env file needed there.

## Architecture notes worth knowing before you extend this

- **`backend/src/services/chain.service.ts`** is the only file allowed to
  talk to the blockchain (spec section 3). `story.service.ts` (home of
  `purgeStoryMedia`) has zero import of it — the one read that needs an
  on-chain lookup, `assembleStoryView`, was deliberately split into its own
  file, `storyView.service.ts`, so that guarantee is checkable by grepping
  imports rather than by convention.
- **Consent** (`Person.consentPublic`) has no default anywhere — not in the
  Prisma schema, not in Zod, not in the frontend form state. A missing value
  is a validation error. Filtering happens fresh on every `GET /story` call.
- The image field the follow-up spec message will add to `Certificate` /
  the EAS schema has a marked insertion point in both
  `prisma/schema.prisma` and `backend/src/config/eas.config.ts`.
- No test files were written, per spec section 9.
- One real limitation, flagged inline in `FounderDashboardPage.tsx` and
  `storyView.service.ts`: `GET /story` only ever returns people currently
  set to public (private people are filtered with no trace, per spec
  section 8's "no hint they were removed" rule). I added `id` to that
  response's `visiblePeople` so the dashboard has something real to send
  back to `PATCH /consent` — but because private people never come back in
  this response, the current UI can toggle someone *to* private, but can't
  toggle them back *to* public afterwards (they've vanished from the list
  it's built from). A real build would add a seventh, founder-scoped read
  returning full `Person` rows regardless of consent; that's outside the
  six specced endpoints, so it's left as a note rather than built.
