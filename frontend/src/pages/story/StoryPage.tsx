import { useParams } from "react-router-dom";
import { Users, Clapperboard, ShieldCheck } from "lucide-react";
import { useStory } from "../../hooks/useStory";
import { resolveMediaUrl } from "../../lib/axios";
import { VideoPlayer } from "../../components/common/VideoPlayer";
import { CertificatePanel } from "../../components/common/CertificatePanel";
import { ShareButton } from "../../components/common/ShareButton";
import { Card, CardContent } from "../../components/ui/Card";

export default function StoryPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const { data, isLoading, isError, error } = useStory(certificateId ?? "");

  if (isLoading) {
    return (
      <PageShell>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-primary-soft" />
          <div className="aspect-video rounded-2xl bg-primary-soft" />
          <div className="h-24 rounded-2xl bg-primary-soft" />
        </div>
      </PageShell>
    );
  }

  if (isError || !data) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return (
      <PageShell>
        <Card>
          <CardContent className="py-12 text-center text-muted">
            {status === 404 ? "We couldn't find that certificate." : "Something went wrong loading this story."}
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const { certificate, story, storyStatus } = data;
  const shareUrl = window.location.href;

  return (
    <PageShell>
      <header className="animate-rise mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck size={13} />
            Impact verified on-chain
          </div>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground">
            {certificate.sdgIndicator} milestone
          </h1>
          <p className="mt-1 text-muted">{certificate.region}</p>
        </div>
        <ShareButton url={shareUrl} label="Share this story" />
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="animate-rise space-y-4 md:col-span-2">
          {storyStatus === "not_started" && (
            <Card>
              <CardContent className="py-14 text-center text-muted">Story coming soon.</CardContent>
            </Card>
          )}

          {storyStatus === "generating" && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-muted">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-primary" />
                Generating the story clip…
              </CardContent>
            </Card>
          )}

          {storyStatus === "ready" && story.generatedClipUrl && (
            <div className="overflow-hidden rounded-2xl shadow-card">
              <VideoPlayer src={resolveMediaUrl(story.generatedClipUrl)!} />
            </div>
          )}

          {storyStatus === "ready" && !story.generatedClipUrl && (
            <Card>
              <CardContent className="flex items-center gap-2 py-6 text-muted">
                <Clapperboard size={16} />
                This milestone's story clip isn't publicly available right now.
              </CardContent>
            </Card>
          )}

          {story.milestoneText && (
            <Card>
              <CardContent className="py-5 text-pretty text-lg font-medium leading-relaxed text-foreground">
                {story.milestoneText}
              </CardContent>
            </Card>
          )}

          {story.visiblePeople.length > 0 && (
            <Card>
              <CardContent className="py-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
                  <Users size={15} />
                  People featured
                </h2>
                <ul className="space-y-2">
                  {story.visiblePeople.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2 text-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-foreground">
                        {p.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-semibold text-foreground">{p.name}</span>
                      {p.role && <span className="text-muted">· {p.role}</span>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="animate-rise">
          <CertificatePanel
            region={certificate.region}
            milestoneDate={certificate.milestoneDate}
            sdgIndicator={certificate.sdgIndicator}
            coverageAmount={certificate.coverageAmount}
            txHash={certificate.txHash}
            chainNetwork={certificate.chainNetwork}
            certificateImageUrl={certificate.certificateImageUrl}
          />
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">{children}</div>;
}
