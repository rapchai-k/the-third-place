import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gift, CheckCircle, AlertCircle } from 'lucide-react';

interface ReferralCodeInputProps {
  onApplyCode?: (code: string) => void;
  loading?: boolean;
  error?: string;
  success?: boolean;
  className?: string;
}

export const ReferralCodeInput = ({ 
  onApplyCode, 
  loading, 
  error, 
  success,
  className 
}: ReferralCodeInputProps) => {
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (referralCode.trim() && onApplyCode) {
      onApplyCode(referralCode.trim().toUpperCase());
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Have a Referral Code?
        </CardTitle>
        <CardDescription>
          Enter a referral code to get special community benefits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referral-code">Referral Code</Label>
            <div className="flex gap-2">
              <Input
                id="referral-code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter referral code"
                className="font-mono tracking-wider"
                disabled={loading || success}
                maxLength={8}
              />
              <Button 
                type="submit" 
                disabled={!referralCode.trim() || loading || success}
                className="shrink-0"
              >
                {loading ? "Applying..." : "Apply"}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Referral code applied successfully! You and your referrer will both get special benefits.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Benefits of Using a Referral Code</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Priority access to exclusive events</li>
            <li>• Special community badges</li>
            <li>• Enhanced networking opportunities</li>
            <li>• Early access to new features</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};