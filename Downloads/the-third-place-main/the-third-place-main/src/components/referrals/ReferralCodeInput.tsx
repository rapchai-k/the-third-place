import { useState, useEffect } from 'react';
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
  initialCode?: string;
  minimal?: boolean; // When true, renders without Card wrapper
}

export const ReferralCodeInput = ({
  onApplyCode,
  loading,
  error,
  success,
  className,
  initialCode,
  minimal = false
}: ReferralCodeInputProps) => {
  const [referralCode, setReferralCode] = useState(initialCode || '');
  const [inputError, setInputError] = useState('');

  // Update referral code when initialCode changes
  useEffect(() => {
    if (initialCode) {
      setReferralCode(initialCode);
    }
  }, [initialCode]);

  // Function to extract referral code from URL
  const extractReferralCode = (input: string): string => {
    // Check if input is a URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
      try {
        const url = new URL(input);
        const refParam = url.searchParams.get('ref');
        if (refParam) {
          return refParam.toUpperCase();
        }
        throw new Error('No referral code found in URL');
      } catch {
        throw new Error('Invalid URL format');
      }
    }

    // If not a URL, validate as alphanumeric code
    const cleanCode = input.trim().toUpperCase();
    if (!/^[A-Z0-9]+$/.test(cleanCode)) {
      throw new Error('Referral code must contain only letters and numbers');
    }

    return cleanCode;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputError('');

    // If input looks like a URL, try to extract the referral code
    if (value.startsWith('http://') || value.startsWith('https://')) {
      try {
        const extractedCode = extractReferralCode(value);
        setReferralCode(extractedCode);
      } catch (error) {
        setInputError(error instanceof Error ? error.message : 'Invalid input');
        setReferralCode(value); // Keep the invalid input to show user what they typed
      }
    } else {
      // For non-URL input, just convert to uppercase and validate
      const upperValue = value.toUpperCase();
      setReferralCode(upperValue);

      // Validate if there's content
      if (upperValue.trim() && !/^[A-Z0-9]+$/.test(upperValue.trim())) {
        setInputError('Referral code must contain only letters and numbers');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!referralCode.trim()) {
      setInputError('Please enter a referral code');
      return;
    }

    try {
      const validCode = extractReferralCode(referralCode);
      if (onApplyCode) {
        onApplyCode(validCode);
      }
    } catch (error) {
      setInputError(error instanceof Error ? error.message : 'Invalid referral code');
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="referral-code">Referral Code (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="referral-code"
            value={referralCode}
            onChange={handleInputChange}
            placeholder="Enter referral code (e.g., 8D604377)"
            className="font-mono tracking-wider"
            disabled={loading || success}
          />
          <Button
            type="submit"
            disabled={!referralCode.trim() || !!inputError || loading || success}
            className="shrink-0"
          >
            {loading ? "Applying..." : success ? "Applied!" : "Apply"}
          </Button>
        </div>
        {inputError && (
          <p className="text-sm text-destructive">{inputError}</p>
        )}
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
            Referral code ready! It will be applied when you create your account.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );

  if (minimal) {
    return <div className={className}>{formContent}</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Have a Referral Code?
        </CardTitle>
        <CardDescription>
          Enter a referral code (like "8D604377") to get special community benefits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formContent}

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