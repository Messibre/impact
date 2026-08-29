import { Loader2 } from "lucide-react";
import { Input } from "../ui/Input";
import { Switch } from "../ui/Switch";

interface PersonConsentRowProps {
  name: string;
  role?: string;
  consentPublic: boolean | null; // null = not yet explicitly set
  onNameChange?: (value: string) => void;
  onRoleChange?: (value: string) => void;
  onConsentChange: (value: boolean) => void;
  editableNameRole?: boolean;
  saving?: boolean;
}

// Reused for both the create form (editable name/role) and the manage-consent
// view (name/role read-only, toggle saves immediately).
export function PersonConsentRow({
  name,
  role,
  consentPublic,
  onNameChange,
  onRoleChange,
  onConsentChange,
  editableNameRole = false,
  saving = false,
}: PersonConsentRowProps) {
  const isPublic = consentPublic === true;
  const notSet = consentPublic === null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted p-3 sm:flex-row sm:items-center">
      {editableNameRole ? (
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input placeholder="Name" value={name} onChange={(e) => onNameChange?.(e.target.value)} className="flex-1" />
          <Input
            placeholder="Role (optional)"
            value={role ?? ""}
            onChange={(e) => onRoleChange?.(e.target.value)}
            className="flex-1"
          />
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{name || "Unnamed"}</p>
          {role && <p className="truncate text-sm text-muted">{role}</p>}
        </div>
      )}
      <div className="flex items-center justify-between gap-2.5 sm:justify-end">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            notSet
              ? "bg-amber-50 text-amber-700"
              : isPublic
                ? "bg-emerald-50 text-emerald-700"
                : "bg-primary-soft text-muted"
          }`}
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          {notSet ? "Choose visibility" : isPublic ? "Public" : "Private"}
        </span>
        <Switch checked={isPublic} onCheckedChange={onConsentChange} disabled={saving} />
      </div>
    </div>
  );
}
