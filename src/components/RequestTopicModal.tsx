import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface RequestTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestTopicModal = ({ isOpen, onClose }: RequestTopicModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [communityId, setCommunityId] = useState('');

  // Fetch all communities for the dropdown
  const { data: communities } = useQuery({
    queryKey: ['communities-for-topic-request'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Fetch user's current memberships
  const { data: userMemberships } = useQuery({
    queryKey: ['userMemberships', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return data.map((m) => m.community_id);
    },
    enabled: isOpen && !!user,
  });

  const resetForm = () => {
    setTopic('');
    setDescription('');
    setReason('');
    setCommunityId('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };



  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Auto-join community if the user is not already a member
      const isMember = userMemberships?.includes(communityId);
      if (!isMember) {
        const { error: joinError } = await supabase
          .from('community_members')
          .insert({ community_id: communityId, user_id: user.id });
        if (joinError) throw joinError;
        // Invalidate memberships cache so rest of app reflects the join
        queryClient.invalidateQueries({ queryKey: ['userMemberships', user.id] });
      }

      // Insert the topic request
      const { error } = await supabase.from('topic_requests').insert({
        user_id: user.id,
        community_id: communityId,
        topic,
        description,
        reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Topic requested!',
        description: 'Your topic suggestion has been submitted for review.',
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const canSubmit =
    topic.trim().length > 0 &&
    description.trim().length > 0 &&
    reason.trim().length > 0 &&
    communityId.length > 0 &&
    !submitMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request a Discussion Topic</DialogTitle>
          <DialogDescription>
            Suggest a topic you'd like the community to discuss. Our team will review and
            create the discussion if approved.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitMutation.mutate();
          }}
          className="space-y-4"
        >
          {/* Community */}
          <div className="space-y-2">
            <Label htmlFor="community">Community</Label>
            <Select value={communityId} onValueChange={setCommunityId}>
              <SelectTrigger id="community">
                <SelectValue placeholder="Select a community" />
              </SelectTrigger>
              <SelectContent>
                {communities?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {userMemberships?.includes(c.id) ? '' : ' (will auto-join)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic title */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic Title</Label>
            <Input
              id="topic"
              placeholder="e.g. Best cafés to work from in Bangalore"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={150}
              disabled={submitMutation.isPending}
            />
          </div>

          {/* Description / prompt */}
          <div className="space-y-2">
            <Label htmlFor="description">Discussion Prompt</Label>
            <Textarea
              id="description"
              placeholder="What question or prompt should kick off this discussion?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              disabled={submitMutation.isPending}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will be shown as the discussion prompt if approved.
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Why is this topic important?</Label>
            <Textarea
              id="reason"
              placeholder="Help us understand why this topic matters to the community."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              disabled={submitMutation.isPending}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};