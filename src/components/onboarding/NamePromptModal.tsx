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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface NamePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onNameSaved: () => void;
  defaultName?: string;
}

export const NamePromptModal = ({
  open,
  onOpenChange,
  userId,
  onNameSaved,
  defaultName,
}: NamePromptModalProps) => {
  const [name, setName] = useState(defaultName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PLACEHOLDER_NAMES = [
    'user', 'random', 'test', 'guest', 'anonymous',
    'unknown', 'noname', 'no name', 'na', 'n/a', 'none',
    'admin', 'default', 'temp', 'abc', 'xyz', 'asdf',
  ];

  const isPlaceholderName = (value: string) =>
    PLACEHOLDER_NAMES.includes(value.trim().toLowerCase());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || loading) return;

    if (isPlaceholderName(trimmed)) {
      setError('Please enter your real name.');
      return;
    }
    setError('');

    setLoading(true);

    const { error: updateError } = await supabase
      .from('users')
      .update({ name: trimmed })
      .eq('id', userId);

    if (updateError) {
      toast({
        variant: 'destructive',
        title: 'Failed to save name',
        description: 'Please try again.',
      });
    } else {
      toast({
        title: 'Welcome!',
        description: `Nice to meet you, ${trimmed}!`,
      });
      onNameSaved();
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-card/95 backdrop-blur-md border border-border/50 shadow-glow"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <User className="w-5 h-5 text-primary" />
            What's your name?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Let us know what to call you so the community can get to know you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-name" className="text-foreground font-medium">
              Full Name
            </Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Enter your full name"
              className="bg-background/50 border-border/50 focus:border-primary transition-smooth"
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              variant="gradient"
              disabled={!name.trim() || loading}
              className="w-full transition-bounce"
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
