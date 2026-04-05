import { useState } from "react";
import { Link } from "@/lib/nextRouterAdapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

type State = "idle" | "loading" | "success";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setError("");

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      setState("idle");
    } else {
      setState("success");
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
            <CardTitle className="text-2xl font-bold text-primary">Reset your password</CardTitle>
            <CardDescription>
              Enter your email and we&apos;ll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state === "success" ? (
              <div className="space-y-4">
                <div className="border-2 border-foreground bg-accent p-4 shadow-brutal">
                  <p className="font-bold uppercase tracking-wider text-sm mb-1">Check your email</p>
                  <p className="text-sm text-muted-foreground">
                    If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
                    The link expires in 1 hour.
                  </p>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Didn&apos;t receive it? Check your spam folder or{" "}
                  <button
                    onClick={() => { setState("idle"); setEmail(""); }}
                    className="font-bold underline hover:text-primary"
                  >
                    try again
                  </button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={state === "loading"}
                    placeholder="you@example.com"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={state === "loading"}>
                  {state === "loading" ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/auth"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
              >
                ← Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
