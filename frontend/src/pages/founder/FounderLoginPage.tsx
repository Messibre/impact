import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock } from "lucide-react";
import { useFounderLogin } from "../../hooks/useFounderLogin";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function FounderLoginPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const login = useFounderLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId) return;
    login.mutate(
      { certificateId, password },
      {
        onSuccess: () => navigate(`/upload/${certificateId}/dashboard`),
      }
    );
  };

  const errorStatus = (login.error as { response?: { status?: number } })?.response?.status;
  const errorMessage =
    errorStatus === 401
      ? "Invalid credentials"
      : errorStatus === 429
      ? "Too many attempts, try again later"
      : login.isError
      ? "Something went wrong. Please try again."
      : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm items-center px-4">
      <Card className="animate-rise w-full">
        <CardContent className="pt-6">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <Lock size={20} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Founder login</h1>
            <p className="mt-1 text-sm text-muted">Enter your one-time password to manage this story.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Certificate ID</label>
              <Input value={certificateId ?? ""} readOnly className="bg-surface-muted text-muted" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}
            <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-xs text-muted">
              Don't have your password? Contact your program coordinator.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
