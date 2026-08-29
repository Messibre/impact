import { BadgeCheck, ExternalLink } from "lucide-react";
import { Card, CardContent } from "../ui/Card";

interface CertificatePanelProps {
  region: string;
  milestoneDate: string;
  sdgIndicator: string;
  coverageAmount: number | null;
  txHash: string;
  chainNetwork: string;
  // Blurred workshop photo. Omitted entirely (no placeholder) when absent.
  certificateImageUrl?: string | null;
}

export function CertificatePanel({
  region,
  milestoneDate,
  sdgIndicator,
  coverageAmount,
  txHash,
  chainNetwork,
  certificateImageUrl,
}: CertificatePanelProps) {
  const explorerUrl = `https://sepolia.easscan.org/attestation/view/${txHash}`;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-emerald-50/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <BadgeCheck size={18} className="text-emerald-600" />
          <span className="font-bold tracking-tight text-foreground">Verified on-chain</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {chainNetwork}
        </span>
      </div>
      <CardContent className="space-y-1 pt-5 text-sm">
        {certificateImageUrl && (
          <img
            src={certificateImageUrl}
            alt="Blurred photo of the workshop this milestone covers"
            className="mb-4 aspect-video w-full rounded-xl border border-border object-cover"
          />
        )}
        <Row label="Region" value={region} />
        <Row label="Date" value={new Date(milestoneDate).toLocaleDateString()} />
        <Row label="SDG indicator" value={sdgIndicator} />
        <Row label="Coverage" value={coverageAmount != null ? String(coverageAmount) : "—"} />
        <div className="flex items-center justify-between border-t border-border pt-3 mt-2">
          <span className="text-muted">Transaction</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            {txHash.slice(0, 10)}…
            <ExternalLink size={12} />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
