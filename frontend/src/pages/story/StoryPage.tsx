import { useParams } from "react-router-dom";
import { useStory } from "../../hooks/useStory";
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
          <div className="aspect-video rounded-lg bg-slate-200" />
          <div className="h-24 rounded-lg bg-slate-200" />
        </div>
      </PageShell>
    );
  }

  if (isError || !data) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return (
      <PageShell>
        <Card>
          <CardContent className="py-10 text-center text-slate-600">
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{certificate.sdgIndicator} milestone</h1>
        <p className="text-slate-500">{certificate.region}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          {storyStatus === "not_started" && (
            <Card>
              <CardContent className="py-10 text-center text-slate-500">Story coming soon.</CardContent>
            </Card>
          )}

          {storyStatus === "generating" && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-slate-500">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                Generating the story clip…
              </CardContent>
            </Card>
          )}

          {storyStatus === "ready" && story.generatedClipUrl && <VideoPlayer src={story.generatedClipUrl} />}

          {storyStatus === "ready" && !story.generatedClipUrl && (
            <Card>
              <CardContent className="py-6 text-slate-600">
                This milestone's story clip isn't publicly available right now.
              </CardContent>
            </Card>
          )}

          {story.milestoneText && (
            <Card>
              <CardContent className="text-slate-800">{story.milestoneText}</CardContent>
            </Card>
          )}

          {story.visiblePeople.length > 0 && (
            <Card>
              <CardContent>
                <h2 className="mb-2 font-semibold">People featured</h2>
                <ul className="space-y-1 text-sm text-slate-700">
                  {story.visiblePeople.map((p, i) => (
                    <li key={i}>
                      {p.name}
                      {p.role ? ` — ${p.role}` : ""}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <ShareButton url={shareUrl} />
        </div>

        <div>
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
  return <div className="mx-auto max-w-4xl px-4 py-10">{children}</div>;
}
