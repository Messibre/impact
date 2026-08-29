import { useState } from "react";
import { useIssueCertificate } from "../../hooks/useIssueCertificate";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";
import { QRCodeDisplay } from "../../components/common/QRCodeDisplay";

// Internal-only page (hardcoded admin-token gate for this hackathon build,
// per spec section 7 / 4). Not linked from anywhere else in the app.
export default function AdminIssuePage() {
  const [adminToken, setAdminToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Admin access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Admin token"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
            />
            <Button className="w-full" onClick={() => setUnlocked(true)} disabled={!adminToken}>
              Continue
            </Button>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    issue.mutate({
      workshopName: form.workshopName,
      region: form.region,
      sdgIndicator: form.sdgIndicator,
      milestoneDate: form.milestoneDate,
      coverageAmount: form.coverageAmount ? Number(form.coverageAmount) : undefined,
      adminToken,
    });
  };

  const explorerUrl = issue.data ? `https://sepolia.easscan.org/attestation/view/${issue.data.txHash}` : "";

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Issue a new certificate</CardTitle>
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

              {issue.isError && <Alert variant="destructive">On-chain attestation failed, please retry.</Alert>}

              <Button type="submit" className="w-full" disabled={issue.isPending}>
                {issue.isPending ? "Attesting on Sepolia…" : "Issue certificate"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>Certificate issued successfully.</Alert>
              <Field label="Certificate ID">
                <Input readOnly value={issue.data.certificateId} />
              </Field>
              <div className="flex justify-center py-2">
                <QRCodeDisplay url={issue.data.qrUrl} />
              </div>
              <Field label="Transaction">
                <a href={explorerUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-700 underline">
                  View on EAS Sepolia explorer
                </a>
              </Field>
              <Field label="Founder password (shown once)">
                <div className="flex gap-2">
                  <Input readOnly value={issue.data.founderPassword} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(issue.data!.founderPassword)}
                  >
                    Copy
                  </Button>
                </div>
              </Field>
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
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
