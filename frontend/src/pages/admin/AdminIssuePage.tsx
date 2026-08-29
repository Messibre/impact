import { useState } from "react";
import { ShieldCheck, CheckCircle2, ExternalLink, Copy, Check, KeyRound } from "lucide-react";
import { useIssueCertificate } from "../../hooks/useIssueCertificate";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { QRCodeDisplay } from "../../components/common/QRCodeDisplay";
import { ShareButton } from "../../components/common/ShareButton";

// Internal-only page (hardcoded admin-token gate for this hackathon build,
// per spec section 7 / 4). Not linked from anywhere else in the app.
export default function AdminIssuePage() {
  const [adminToken, setAdminToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm items-center px-4">
        <Card className="animate-rise w-full">
          <CardContent className="pt-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                <ShieldCheck size={20} />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">Admin access</h1>
              <p className="mt-1 text-sm text-muted">Issue verified impact certificates on-chain.</p>
            </div>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Admin token"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && adminToken) setUnlocked(true);
                }}
              />
              <Button size="lg" className="w-full" onClick={() => setUnlocked(true)} disabled={!adminToken}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <IssueForm adminToken={adminToken} />;
}

function IssueForm({ adminToken }: { adminToken: string }) {
  const issue = useIssueCertificate();
  const [form, setForm] = useState({
    workshopName: "",
    region: "",
    sdgIndicator: "",
    milestoneDate: "",
    coverageAmount: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    issue.mutate({
      workshopName: form.workshopName,
      region: form.region,
      sdgIndicator: form.sdgIndicator,
      milestoneDate: form.milestoneDate,
      coverageAmount: form.coverageAmount ? Number(form.coverageAmount) : undefined,
      image,
      adminToken,
    });
  };

  const explorerUrl = issue.data ? `https://sepolia.easscan.org/attestation/view/${issue.data.txHash}` : "";

  const copyPassword = () => {
    if (!issue.data) return;
    navigator.clipboard.writeText(issue.data.founderPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>{issue.data ? "Certificate issued" : "Issue a new certificate"}</CardTitle>
        </CardHeader>
        <CardContent>
          {!issue.data ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Workshop name">
                <Input
                  value={form.workshopName}
                  onChange={(e) => setForm({ ...form, workshopName: e.target.value })}
                  required
                />
              </Field>
              <Field label="Region">
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} required />
              </Field>
              <Field label="SDG indicator">
                <Input
                  value={form.sdgIndicator}
                  onChange={(e) => setForm({ ...form, sdgIndicator: e.target.value })}
                  placeholder="e.g. SDG 8"
                  required
                />
              </Field>
              <Field label="Milestone date">
                <Input
                  type="date"
                  value={form.milestoneDate}
                  onChange={(e) => setForm({ ...form, milestoneDate: e.target.value })}
                  required
                />
              </Field>
              <Field label="Coverage amount (optional)">
                <Input
                  type="number"
                  value={form.coverageAmount}
                  onChange={(e) => setForm({ ...form, coverageAmount: e.target.value })}
                />
              </Field>
              <Field label="Workshop photo (optional)">
                <Input
                  type="file"
                  accept="image/*"
                  className="h-auto py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                />
                <p className="mt-1.5 text-xs text-muted">
                  Blurred automatically before it is stored — never keep a photo with a recognizable face.
                </p>
              </Field>

              {issue.isError && <Alert variant="destructive">On-chain attestation failed, please retry.</Alert>}

              <Button type="submit" size="lg" className="w-full" disabled={issue.isPending}>
                {issue.isPending ? "Attesting on Sepolia…" : "Issue certificate"}
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <Alert variant="success">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                Certificate issued successfully and attested on-chain.
              </Alert>

              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-muted py-5">
                <QRCodeDisplay url={issue.data.qrUrl} size={168} />
                <p className="px-4 text-center text-xs text-muted">
                  Founder scans this to open their story dashboard.
                </p>
                <ShareButton url={issue.data.qrUrl} label="Copy founder link" />
              </div>

              <Field label="Certificate ID">
                <Input readOnly value={issue.data.certificateId} className="font-mono text-xs" />
              </Field>

              {issue.data.certificateImageUrl && (
                <Field label="Blurred workshop photo">
                  <img
                    src={issue.data.certificateImageUrl}
                    alt="Blurred workshop photo stored for this certificate"
                    loading="lazy"
                    className="aspect-video w-full rounded-xl border border-border bg-surface-muted object-cover"
                  />
                </Field>
              )}

              <Field label="Transaction">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  View on EAS Sepolia explorer
                  <ExternalLink size={14} />
                </a>
              </Field>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-sm font-bold text-amber-800">
                  <KeyRound size={15} />
                  Founder password — shown once
                </div>
                <div className="flex gap-2">
                  <Input readOnly value={issue.data.founderPassword} className="bg-surface font-mono" />
                  <Button type="button" variant="outline" onClick={copyPassword}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}
