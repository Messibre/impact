import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Search, Lock, LinkIcon, Eye, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent } from "../../components/ui/Card";

// Public landing page. The donor verify form extracts an attestation UID from
// either a raw ID or a pasted /story/:id link and routes to the public story.
export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const handleVerify = (e: FormEvent) => {
    e.preventDefault();
    const raw = query.trim();
    if (!raw) {
      setError("Enter a certificate ID or story link.");
      return;
    }
    // Accept a full URL (…/story/0xabc) or a bare id.
    const match = raw.match(/0x[a-fA-F0-9]{6,}/);
    const id = match ? match[0] : raw.split("/").filter(Boolean).pop() ?? raw;
    if (!id) {
      setError("That doesn't look like a valid certificate ID.");
      return;
    }
    setError("");
    navigate(`/story/${id}`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <ShieldCheck size={18} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-foreground">Proof of Impact</span>
        </div>
        <a
          href="#verify"
          className="hidden text-sm font-semibold text-muted transition-colors hover:text-foreground sm:block"
        >
          Verify a certificate
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="animate-rise">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Verified on-chain, privacy-first
            </div>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
              Impact people can actually see — and trust.
            </h1>
            <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted sm:text-lg">
              Every milestone is attested on Ethereum and paired with a story from the people it reached. Faces stay
              blurred, consent stays in their hands, proof stays permanent.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => document.getElementById("verify")?.scrollIntoView({ behavior: "smooth" })}>
                <Search size={18} />
                Verify a certificate
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
                How it works
              </Button>
            </div>
          </div>

          <div className="animate-rise relative" style={{ animationDelay: "80ms" }}>
            <div className="overflow-hidden rounded-3xl border border-border shadow-soft-lg">
              <img
                src="/hero-community.png"
                alt="A community skills workshop, faces softly blurred to protect privacy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-3 hidden w-44 overflow-hidden rounded-2xl border border-border shadow-soft-lg sm:block">
              <img
                src="/hero-hands.png"
                alt="Hands exchanging a certificate across a table"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="absolute -right-3 -top-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2.5 shadow-soft-lg">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-foreground">Sepolia verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Verify form */}
      <section id="verify" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-10 sm:px-6 sm:py-14">
        <Card className="animate-rise mx-auto max-w-2xl">
          <CardContent className="pt-6">
            <div className="mb-5 text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Verify an impact certificate</h2>
              <p className="mt-1.5 text-sm text-muted">
                Paste a certificate ID or story link to view its on-chain proof and story.
              </p>
            </div>
            <form onSubmit={handleVerify} className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="0x… or https://…/story/0x…"
                  className="font-mono text-sm"
                  aria-label="Certificate ID or story link"
                  aria-invalid={!!error}
                />
              </div>
              <Button type="submit" size="lg" className="shrink-0">
                Verify
                <ArrowRight size={18} />
              </Button>
            </form>
            {error && (
              <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-6 px-4 pb-16 sm:px-6 sm:pb-24">
        <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Proof without exposure
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Feature
            icon={<Lock size={20} />}
            title="Consent-first stories"
            body="People choose whether their voice appears publicly, and can change that decision at any time."
          />
          <Feature
            icon={<Eye size={20} />}
            title="Privacy by default"
            body="Workshop photos are blurred before they are ever stored — no recognizable faces leave the device."
          />
          <Feature
            icon={<LinkIcon size={20} />}
            title="Permanent on-chain proof"
            body="Each milestone is an Ethereum attestation anyone can independently verify on the EAS explorer."
          />
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <span className="font-semibold text-foreground">Proof of Impact</span>
          <span>Verified on Ethereum · Privacy-first impact reporting</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="animate-rise h-full">
      <CardContent className="pt-6">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          {icon}
        </div>
        <h3 className="mb-1.5 text-base font-bold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{body}</p>
      </CardContent>
    </Card>
  );
}
