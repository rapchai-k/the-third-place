import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gift, CheckCircle, AlertCircle, X } from 'lucide-react';

interface ReferralCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyCode: (code: string) => void;
  onSkip: () => void;
  referralCodeFromUrl?: string | null;
  loading?: boolean;
  error?: string;
  success?: boolean;
}

export const ReferralCodeModal = ({
  open,
  onOpenChange,
  onApplyCode,
  onSkip,
  referralCodeFromUrl,
  loading = false,
  error = '',
  success = false,
}: ReferralCodeModalProps) => {
  const [referralCode, setReferralCode] = useState('');

  // Pre-fill with URL code when modal opens
  useEffect(() => {
    if (open && referralCodeFromUrl) {
      setReferralCode(referralCodeFromUrl);
    }
  }, [open, referralCodeFromUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 8) {
      setReferralCode(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (referralCode.trim() && !loading && !success) {
      onApplyCode(referralCode.trim());
    }
  };

  const handleSkip = () => {
    setReferralCode('');
    onSkip();
  };

  const handleClose = () => {
    setReferralCode('');
    onOpenChange(false);
  };

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={handleClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Welcome! Do you have a referral code?
          </DialogTitle>
          <DialogDescription>
            If someone invited you to join, enter their referral code to get special community benefits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Show referral code from URL if present */}
          {referralCodeFromUrl && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <p className="font-medium text-primary">You've been invited!</p>
                  <p className="text-sm text-muted-foreground">
                    Referral code: <code className="font-mono font-bold">{referralCodeFromUrl}</code>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This code has been automatically filled in below
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-referral-code">Referral Code (Optional)</Label>
              <Input
                id="modal-referral-code"
                value={referralCode}
                onChange={handleInputChange}
                placeholder="Enter referral code (e.g., 8D604377)"
                className="font-mono tracking-wider"
                disabled={loading || success}
              />
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
                  Referral code applied successfully! You'll receive special benefits.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!referralCode.trim() || loading || success}
          >
            {loading ? 'Applying...' : success ? 'Applied!' : 'Apply Code'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
