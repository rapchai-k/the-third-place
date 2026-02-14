import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "@/lib/nextRouterAdapter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReferralCodeInput } from "@/components/referrals/ReferralCodeInput";
import { useReferrals } from "@/hooks/useReferrals";
import { toast } from "@/hooks/use-toast";
import { shouldShowReferralModal } from "@/utils/userUtils";
import { Chrome } from "lucide-react";
import { analytics } from "@/utils/analytics";

export const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralCodeApplied, setReferralCodeApplied] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [currentTab, setCurrentTab] = useState("signin");

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { applyReferralCode } = useReferrals();

  const from = location.state?.from?.pathname || "/dashboard";
  const referralCodeFromUrl = searchParams.get('ref');

  // Auto-apply referral code from URL when component mounts
  useEffect(() => {
    if (referralCodeFromUrl && !referralCodeApplied) {
      setReferralCodeApplied(true);
    }
  }, [referralCodeFromUrl]);

  useEffect(() => {
    if (user) {
      // Apply referral code after successful authentication if needed
      const applyReferralAfterAuth = async () => {
        // Only apply referral code automatically for non-OAuth users
        // OAuth users will be handled by the Dashboard modal
        if (referralCodeFromUrl && referralCodeApplied && user.id && !shouldShowReferralModal(user)) {
          const success = await applyReferralCode(referralCodeFromUrl, user.id);
          if (success) {
            toast({
              title: "Referral applied!",
              description: "You've been successfully referred and will receive special benefits.",
            });
          }
        }
      };

      applyReferralAfterAuth();
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, referralCodeFromUrl, referralCodeApplied, applyReferralCode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
    } else {
      // Track successful login
      analytics.login('email', user?.id);

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const result = await signUp(email, password);

    if (result.error) {
      setError(result.error.message);
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: result.error.message,
      });
    } else {
      // Track successful sign up
      analytics.signUp('email', user?.id);

      // Apply referral code if available (we'll get user from context after auth)
      toast({
        title: "Account created!",
        description: "Please check your email for verification.",
      });
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);

    // Store referral code in localStorage before OAuth redirect
    if (referralCodeFromUrl) {
      localStorage.setItem('pendingReferralCode', referralCodeFromUrl);
    }

    const result = await signInWithGoogle();

    if (result.error) {
      setError(result.error.message);
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: result.error.message,
      });
    }

    setLoading(false);
  };

  const handleApplyReferralCode = async (code: string) => {
    setReferralError("");

    // For now, just mark it as applied - we'll apply it after successful registration
    setReferralCodeApplied(true);
    toast({
      title: "Referral code ready!",
      description: "The referral code will be applied when you create your account.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl">
        {/* Logo linking to home */}
        <div className="flex justify-center mb-8">
          <a href="/" className="inline-block border-2 border-foreground bg-background px-4 py-2 shadow-brutal hover:shadow-brutal-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150">
            <img src="/logo.png" alt="My Third Place" className="h-16 w-auto" loading="eager" decoding="async" />
          </a>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Welcome to My Third Place</CardTitle>
            <CardDescription>
              Connect with your local community and discover events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <div className="space-y-4 mt-6">
                  {/* Google Sign In Button - Above the fold */}
                  <Button
                    variant="default"
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                  </Button>

                  {/* OR Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        OR
                      </span>
                    </div>
                  </div>

                  {/* Email/Password Form */}
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <div className="space-y-4 mt-6">
                  {/* Google Sign In Button - Above the fold */}
                  <Button
                    variant="default"
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                  </Button>

                  {/* OR Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        OR
                      </span>
                    </div>
                  </div>

                  {/* Email/Password Form */}
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                    </div>

                    {/* Referral Code Input for Sign Up */}
                    <div className="space-y-4">
                      <ReferralCodeInput
                        onApplyCode={handleApplyReferralCode}
                        error={referralError}
                        success={referralCodeApplied}
                        initialCode={referralCodeFromUrl || undefined}
                        minimal={true}
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>

            {/* Referral Code Display Card - Only show during sign-up */}
            {currentTab === "signup" && referralCodeFromUrl && (
              <div className="mt-6">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <p className="font-medium text-primary">You've been invited!</p>
                      <p className="text-sm text-muted-foreground">
                        Referral code from link: <code className="font-mono font-bold">{referralCodeFromUrl}</code>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The referral code has been automatically filled in above
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;