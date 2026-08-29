import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-bold">Your story</h1>
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
    <Card>
      <CardHeader>
        <CardTitle>Upload your story</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Voice note</label>
            <VoiceRecorder onChange={setVoice} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Clip or photo</label>
            <ClipRecorder onChange={setClip} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Milestone line</label>
            <Input value={milestoneText} onChange={(e) => setMilestoneText(e.target.value)} placeholder="What happened?" />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">People in this clip</label>
              <Button type="button" variant="outline" onClick={addPerson}>
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
              <p className="mt-2 text-xs text-red-600">
                Consent must be explicitly set for every tagged person before you can submit.
              </p>
            )}
          </div>

          {upload.isError && <Alert variant="destructive">Upload failed. Please try again.</Alert>}

          <Button type="submit" className="w-full" disabled={!canSubmit || upload.isPending}>
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
              <VideoPlayer src={resolveMediaUrl(story.story.generatedClipUrl)!} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manage consent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {peopleLoading && <p className="text-sm text-slate-500">Loading people…</p>}
          {!peopleLoading && (!people || people.length === 0) && (
            <p className="text-sm text-slate-500">No people were tagged in this story.</p>
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

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            Delete my story
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete this story?">
        <p className="mb-4 text-sm text-slate-600">
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
