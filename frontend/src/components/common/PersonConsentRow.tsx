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
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
      {editableNameRole ? (
        <>
          <Input placeholder="Name" value={name} onChange={(e) => onNameChange?.(e.target.value)} className="flex-1" />
          <Input
            placeholder="Role (optional)"
            value={role ?? ""}
            onChange={(e) => onRoleChange?.(e.target.value)}
            className="flex-1"
          />
        </>
      ) : (
        <div className="flex-1">
          <p className="font-medium">{name}</p>
          {role && <p className="text-sm text-slate-500">{role}</p>}
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{consentPublic ? "Public" : "Private"}</span>
        <Switch checked={consentPublic === true} onCheckedChange={onConsentChange} disabled={saving} />
      </div>
    </div>
  );
}
