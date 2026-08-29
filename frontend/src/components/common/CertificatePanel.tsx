import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface CertificatePanelProps {
  region: string;
  milestoneDate: string;
  sdgIndicator: string;
  coverageAmount: number | null;
  txHash: string;
  chainNetwork: string;
}

export function CertificatePanel({
  region,
  milestoneDate,
  sdgIndicator,
  coverageAmount,
  txHash,
  chainNetwork,
}: CertificatePanelProps) {
  const explorerUrl = `https://sepolia.easscan.org/attestation/view/${txHash}`;

  return (
    <Card className="border-2 border-emerald-200 bg-emerald-50/40">
      <CardHeader className="flex flex-row items-center justify-between border-emerald-100">
        <CardTitle>Verified on-chain</CardTitle>
        <Badge className="bg-emerald-100 text-emerald-800">{chainNetwork}</Badge>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Region" value={region} />
        <Row label="Date" value={new Date(milestoneDate).toLocaleDateString()} />
        <Row label="SDG indicator" value={sdgIndicator} />
        <Row label="Coverage" value={coverageAmount != null ? String(coverageAmount) : "—"} />
        <div className="flex items-center justify-between pt-2">
          <span className="text-slate-500">Transaction</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-emerald-700 underline"
          >
            {txHash.slice(0, 10)}…
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
