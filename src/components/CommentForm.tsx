import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { Send, Loader2 } from "lucide-react";
import { analytics } from "@/utils/analytics";

interface CommentFormProps {
  discussionId: string;
  onCommentAdded?: () => void;
}

export const CommentForm = ({ discussionId, onCommentAdded }: CommentFormProps) => {
  const [comment, setComment] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logCommentCreate } = useActivityLogger();

  const addComment = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('discussion_comments')
        .insert({
          discussion_id: discussionId,
          user_id: user.id,
          text: text.trim()
        });

      if (error) throw error;
      return { commentId: `comment-${Date.now()}` }; // Return a temporary ID for logging
    },
    onMutate: async (text: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['discussion-comments', discussionId] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(['discussion-comments', discussionId]);

      // Create optimistic comment
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        discussion_id: discussionId,
        user_id: user?.id,
        text: text.trim(),
        created_at: new Date().toISOString(),
        users: {
          name: user?.user_metadata?.name || 'You',
          photo_url: user?.user_metadata?.avatar_url
        },
        isPending: true
      };

      // Optimistically update comments
      queryClient.setQueryData(['discussion-comments', discussionId], (old: unknown) => {
        const comments = old as typeof optimisticComment[] | undefined;
        return comments ? [...comments, optimisticComment] : [optimisticComment];
      });

      // Clear form immediately
      setComment("");

      // Log comment creation
      logCommentCreate(discussionId, optimisticComment.id, {
        comment_text: text.trim(),
        comment_length: text.trim().length
      });

      // Track create_comment for GA4
      analytics.createComment({
        comment_id: optimisticComment.id,
        discussion_id: discussionId,
        comment_length: text.trim().length,
      });

      // Track create_comment for GA4
      analytics.createComment({
        comment_id: optimisticComment.id,
        discussion_id: discussionId,
        comment_length: text.trim().length,
      });

      // Show success toast immediately
      toast({
        title: "Comment posted!",
        description: "Your comment has been added.",
      });

      onCommentAdded?.();

      return { previousComments };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments !== undefined) {
        queryClient.setQueryData(['discussion-comments', discussionId], context.previousComments);
      }
      
      // Restore comment text
      setComment(variables);
      
      toast({
        title: "Failed to post comment",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to get real data
      queryClient.invalidateQueries({ queryKey: ['discussion-comments', discussionId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      addComment.mutate(comment);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-4 border-2 border-dashed border-muted rounded-lg">
        <p className="text-muted-foreground mb-2">
          Sign in to join the discussion
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/auth'}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts..."
        className="resize-none"
        rows={3}
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!comment.trim() || addComment.isPending}
          size="sm"
        >
          {addComment.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Post Comment
            </>
          )}
        </Button>
      </div>
    </form>
  );
};