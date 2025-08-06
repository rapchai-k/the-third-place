import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

interface CommentFormProps {
  discussionId: string;
  onCommentAdded?: () => void;
}

export const CommentForm = ({ discussionId, onCommentAdded }: CommentFormProps) => {
  const [comment, setComment] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ['discussion-comments', discussionId] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
      onCommentAdded?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post comment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
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