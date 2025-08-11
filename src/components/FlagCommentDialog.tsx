import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Flag, AlertTriangle } from 'lucide-react';

interface FlagCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
}

const FLAG_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'spam', label: 'Spam or promotional content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'off-topic', label: 'Off-topic or irrelevant' },
  { value: 'misinformation', label: 'Misinformation or false claims' },
  { value: 'other', label: 'Other (please specify)' },
];

export const FlagCommentDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: FlagCommentDialogProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleSubmit = () => {
    if (!selectedReason) return;
    
    const reason = selectedReason === 'other' 
      ? customReason.trim() 
      : FLAG_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
    
    if (selectedReason === 'other' && !customReason.trim()) {
      return; // Don't submit if "other" is selected but no custom reason provided
    }
    
    onSubmit(reason);
    
    // Reset form
    setSelectedReason('');
    setCustomReason('');
  };

  const handleCancel = () => {
    setSelectedReason('');
    setCustomReason('');
    onOpenChange(false);
  };

  const isValid = selectedReason && (selectedReason !== 'other' || customReason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-orange-500" />
            Flag Comment
          </DialogTitle>
          <DialogDescription>
            Help us maintain a respectful community by reporting inappropriate content.
            Your report will be reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-700">
              False reports may result in restrictions on your account. 
              Please only flag content that violates our community guidelines.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Reason for flagging:</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {FLAG_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label 
                    htmlFor={reason.value} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                Please specify:
              </Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe why this comment should be flagged..."
                className="resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {customReason.length}/500 characters
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
