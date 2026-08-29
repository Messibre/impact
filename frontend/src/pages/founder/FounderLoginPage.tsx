import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFounderLogin } from "../../hooks/useFounderLogin";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Founder login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-600">Certificate ID</label>
              <Input value={certificateId ?? ""} readOnly className="bg-slate-50 text-slate-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-600">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-xs text-slate-400">
              Don't have your password? Contact your program coordinator.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
