import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
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

export const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralCodeApplied, setReferralCodeApplied] = useState(false);
  const [referralError, setReferralError] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { applyReferralCode } = useReferrals();

  const from = location.state?.from?.pathname || "/";
  const referralCodeFromUrl = searchParams.get('ref');

  useEffect(() => {
    if (user) {
      // Apply referral code after successful authentication if needed
      const applyReferralAfterAuth = async () => {
        if (referralCodeFromUrl && referralCodeApplied && user.id) {
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
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">Welcome to MyThirdPlace</CardTitle>
            <CardDescription>
              Connect with your local community and discover events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
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
              </TabsContent>
              
              <TabsContent value="signup">
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
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                Continue with Google
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral Code Section */}
        <div className="space-y-4">
          <ReferralCodeInput
            onApplyCode={handleApplyReferralCode}
            error={referralError}
            success={referralCodeApplied}
          />
          
          {referralCodeFromUrl && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <p className="font-medium text-primary">You've been invited!</p>
                  <p className="text-sm text-muted-foreground">
                    Referral code: <code className="font-mono font-bold">{referralCodeFromUrl}</code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create your account to activate special benefits
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;