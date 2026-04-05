import { useState, useEffect } from "react";
import { Link, useNavigate } from "@/lib/nextRouterAdapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type State = "detecting" | "ready" | "loading" | "success" | "error";

export const ResetPassword = () => {
  const [state, setState] = useState<State>("detecting");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for Supabase to fire PASSWORD_RECOVERY from the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setState("ready");
      }
    });

    // Timeout: if no PASSWORD_RECOVERY fires within 8s, the link is invalid/expired
    const timeout = setTimeout(() => {
      setState((current) => {
        if (current === "detecting") return "error";
        return current;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setState("loading");

    const { error } = await updatePassword(password);

    if (error) {
      setError(error.message);
      setState("ready");
    } else {
      setState("success");
      toast({
        title: "Password updated!",
        description: "You can now sign in with your new password.",
      });
      setTimeout(() => navigate("/auth"), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <a
            href="/"
            className="inline-block border-2 border-foreground bg-background px-4 py-2 shadow-brutal hover:shadow-brutal-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150"
          >
            <img src="/logo.png" alt="My Third Place" className="h-16 w-auto" loading="eager" decoding="async" />
          </a>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Set new password</CardTitle>
            <CardDescription>
              {state === "detecting" ? "Verifying your reset link…" : "Choose a new password for your account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state === "detecting" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-6">
                  <div className="w-8 h-8 border-2 border-foreground border-t-primary animate-spin" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Verifying your reset link…
                </p>
              </div>
            )}

            {state === "error" && (
              <div className="space-y-4">
                <div className="border-2 border-destructive bg-destructive/10 p-4">
                  <p className="font-bold uppercase tracking-wider text-sm text-destructive mb-1">Link expired or invalid</p>
                  <p className="text-sm text-muted-foreground">
                    This password reset link has expired or is invalid. Please request a new one.
                  </p>
                </div>
                <Button asChild className="w-full">
                  <Link to="/auth/forgot-password">Request New Reset Link</Link>
                </Button>
              </div>
            )}

            {state === "success" && (
              <div className="border-2 border-foreground bg-accent p-4 shadow-brutal">
                <p className="font-bold uppercase tracking-wider text-sm mb-1">Password updated!</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to sign in…
                </p>
              </div>
            )}

            {(state === "ready" || state === "loading") && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={state === "loading"}
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm new password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={state === "loading"}
                    minLength={6}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={state === "loading"}>
                  {state === "loading" ? "Updating…" : "Update Password"}
                </Button>
              </form>
            )}

            {state !== "error" && state !== "success" && (
              <div className="mt-6 text-center">
                <Link
                  to="/auth"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
                >
                  ← Back to Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
