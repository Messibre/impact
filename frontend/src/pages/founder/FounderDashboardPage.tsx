import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, AlertTriangle, Users, Sparkles, QrCode } from "lucide-react";
import { useStory } from "../../hooks/useStory";
import { useUploadStory, PersonFormRow } from "../../hooks/useUploadStory";
import { useUpdateConsent } from "../../hooks/useUpdateConsent";
import { useFounderPeople } from "../../hooks/useFounderPeople";
import { useDeleteStory } from "../../hooks/useDeleteStory";
import { getFounderToken } from "../../lib/founderToken";
import { resolveMediaUrl } from "../../lib/axios";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Alert } from "../../components/ui/Alert";
import { Dialog } from "../../components/ui/Dialog";
import { VoiceRecorder } from "../../components/common/VoiceRecorder";
import { ClipRecorder } from "../../components/common/ClipRecorder";
import { PersonConsentRow } from "../../components/common/PersonConsentRow";
import { VideoPlayer } from "../../components/common/VideoPlayer";
import { QRCodeDisplay } from "../../components/common/QRCodeDisplay";
import { ShareButton } from "../../components/common/ShareButton";

// The public story URL a founder shares with donors. Derived from the same
// PUBLIC_APP_BASE_URL the backend bakes into the QR, so both point to the
// exact same donor-facing verification page.
function buildStoryUrl(certificateId: string) {
  return `${window.location.origin}/story/${certificateId}`;
}

export default function FounderDashboardPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (certificateId && !getFounderToken(certificateId)) {
      navigate(`/upload/${certificateId}`);
    }
  }, [certificateId, navigate]);

  const { data: story } = useStory(certificateId ?? "");
  const storyExists = story && story.storyStatus !== "not_started";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:py-14">
      <header className="animate-rise">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Your story</h1>
        <p className="mt-1 text-muted">
          {storyExists
            ? "Share it with donors and manage who appears publicly."
            : "Add a voice note and clip to bring this milestone to life."}
        </p>
      </header>
      {!storyExists && certificateId && <UploadSection certificateId={certificateId} />}
      {storyExists && certificateId && story && (
        <ManageConsentSection certificateId={certificateId} story={story} />
      )}
    </div>
  );
}

function UploadSection({ certificateId }: { certificateId: string }) {
  const upload = useUploadStory(certificateId);
  const [voice, setVoice] = useState<File | null>(null);
  const [clip, setClip] = useState<File | null>(null);
  const [milestoneText, setMilestoneText] = useState("");
  const [people, setPeople] = useState<(PersonFormRow & { consentSet: boolean })[]>([]);

  const addPerson = () => setPeople((p) => [...p, { name: "", consentPublic: false, consentSet: false }]);

  const allConsentSet = people.every((p) => p.consentSet);
  const canSubmit = voice && clip && milestoneText.trim().length >= 5 && allConsentSet;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voice || !clip || !allConsentSet) return;
    upload.mutate({
      voice,
      clip,
      milestoneText,
      people: people.map(({ consentSet: _consentSet, ...rest }) => rest),
    });
  };

  return (
    <Card className="animate-rise">
      <CardHeader>
        <CardTitle>Upload your story</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Voice note</label>
            <VoiceRecorder onChange={setVoice} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Clip or photo</label>
            <ClipRecorder onChange={setClip} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Milestone line</label>
            <Input value={milestoneText} onChange={(e) => setMilestoneText(e.target.value)} placeholder="What happened?" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Users size={15} />
                People in this clip
              </label>
              <Button type="button" variant="outline" size="sm" onClick={addPerson}>
                <Plus size={15} />
                Add person
              </Button>
            </div>
            <div className="space-y-2">
              {people.map((person, i) => (
                <PersonConsentRow
                  key={i}
                  name={person.name}
                  role={person.role}
                  consentPublic={person.consentSet ? person.consentPublic : null}
                  editableNameRole
                  onNameChange={(v) =>
                    setPeople((prev) => prev.map((p, idx) => (idx === i ? { ...p, name: v } : p)))
                  }
                  onRoleChange={(v) =>
                    setPeople((prev) => prev.map((p, idx) => (idx === i ? { ...p, role: v } : p)))
                  }
                  onConsentChange={(v) =>
                    setPeople((prev) =>
                      prev.map((p, idx) => (idx === i ? { ...p, consentPublic: v, consentSet: true } : p))
                    )
                  }
                />
              ))}
            </div>
            {!allConsentSet && people.length > 0 && (
              <p className="mt-2 text-xs font-medium text-destructive">
                Consent must be explicitly set for every tagged person before you can submit.
              </p>
            )}
          </div>

          {upload.isError && <Alert variant="destructive">Upload failed. Please try again.</Alert>}

          <Button type="submit" size="lg" className="w-full" disabled={!canSubmit || upload.isPending}>
            {upload.isPending ? "Uploading…" : "Submit story"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ManageConsentSection({
  certificateId,
  story,
}: {
  certificateId: string;
  story: NonNullable<ReturnType<typeof useStory>["data"]>;
}) {
  const updateConsent = useUpdateConsent(certificateId);
  const deleteStory = useDeleteStory(certificateId);
  const { data: people, isLoading: peopleLoading } = useFounderPeople(certificateId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const storyUrl = buildStoryUrl(certificateId);

  // The consent list is populated from the founder-scoped
  // GET /certificates/:id/people endpoint (useFounderPeople), NOT from
  // GET /story — the public story only returns currently-public people, so
  // a person toggled private would vanish from this list and could never be
  // toggled back. The founder endpoint returns every person regardless of
  // consent, which is what makes re-enabling work. The public page still
  // uses useStory unchanged.

  const handleToggle = (personId: string, value: boolean) => {
    setSavingId(personId);
    updateConsent.mutate([{ id: personId, consentPublic: value }], {
      onSettled: () => setSavingId(null),
    });
  };

  return (
    <div className="space-y-6">
      {story.storyStatus === "ready" && story.story.generatedClipUrl && (
        <div className="animate-rise overflow-hidden rounded-2xl shadow-card">
          <VideoPlayer src={resolveMediaUrl(story.story.generatedClipUrl)!} />
        </div>
      )}

      {/* Ready-to-share link — the donor verification page the QR points to.
          Founders copy/share this instead of typing the route themselves. */}
      <Card className="animate-rise overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-primary px-6 py-4 text-primary-foreground">
          <Sparkles size={18} />
          <div>
            <p className="font-bold tracking-tight">Share your story</p>
            <p className="text-xs text-primary-foreground/70">Send this link to donors to view the verified impact.</p>
          </div>
        </div>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <QRCodeDisplay url={storyUrl} size={132} />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2">
                <QrCode size={15} className="shrink-0 text-muted" />
                <span className="truncate text-sm text-foreground">{storyUrl}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <ShareButton url={storyUrl} label="Copy & share link" variant="default" />
                <Button variant="outline" onClick={() => window.open(storyUrl, "_blank", "noopener")}>
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} />
            Manage consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {peopleLoading && <p className="text-sm text-muted">Loading people…</p>}
          {!peopleLoading && (!people || people.length === 0) && (
            <p className="rounded-xl bg-surface-muted px-4 py-6 text-center text-sm text-muted">
              No people were tagged in this story.
            </p>
          )}
          {people?.map((p) => (
            <PersonConsentRow
              key={p.id}
              name={p.name}
              role={p.role ?? undefined}
              consentPublic={p.consentPublic}
              onConsentChange={(v) => handleToggle(p.id, v)}
              saving={savingId === p.id}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="animate-rise border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={18} />
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            Delete my story
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete this story?">
        <p className="mb-4 text-sm text-muted">
          This permanently removes your voice note, clip, milestone text, and people. Your on-chain
          certificate is not affected.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteStory.mutate(undefined, { onSuccess: () => setConfirmOpen(false) })}
            disabled={deleteStory.isPending}
          >
            {deleteStory.isPending ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
