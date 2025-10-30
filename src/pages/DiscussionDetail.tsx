import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MessageCircle, Clock, Flag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { CommentForm } from "@/components/CommentForm";
import { FlagCommentDialog } from '@/components/FlagCommentDialog';
import { format, isAfter } from "date-fns";
import { useStructuredData, createDiscussionSchema, createBreadcrumbSchema } from '@/utils/schema';

export default function DiscussionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [commentToFlag, setCommentToFlag] = useState<{ id: string; userId: string } | null>(null);
  const { logCommentFlag } = useActivityLogger();
  const { logDiscussionView } = useActivityLogger();

  // Fetch discussion details
  const { data: discussion, isLoading: discussionLoading } = useQuery({
    queryKey: ['discussion', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discussions')
        .select(`
          *,
          communities (name),
          users (name, photo_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch comments with real-time updates
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['discussion-comments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discussion_comments')
        .select(`
          *,
          users (name, photo_url)
        `)
        .eq('discussion_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Add structured data for SEO after discussion and comments data is available
  useStructuredData(discussion ? [
    createBreadcrumbSchema([
      { name: "Home", url: window.location.origin },
      { name: "Discussions", url: `${window.location.origin}/discussions` },
      { name: discussion.title, url: window.location.href }
    ]),
    createDiscussionSchema({
      headline: discussion.title,
      text: discussion.prompt || '',
      url: window.location.href,
      datePublished: discussion.created_at,
      dateModified: discussion.updated_at || discussion.created_at,
      author: {
        name: discussion.users?.name || 'Anonymous',
        url: `${window.location.origin}/profile/${discussion.created_by}`
      },
      commentCount: comments?.length || 0
    })
  ] : []);

  // Check if user is community member
  const { data: isMember } = useQuery({
    queryKey: ['community-membership', discussion?.community_id, user?.id],
    queryFn: async () => {
      if (!user?.id || !discussion?.community_id) return false;
      
      const { data, error } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', discussion.community_id)
        .eq('user_id', user.id)
        .single();

      return !error && !!data;
    },
    enabled: !!user?.id && !!discussion?.community_id,
  });

  // Log discussion view when discussion loads
  useEffect(() => {
    if (id && discussion) {
      logDiscussionView(id, {
        discussion_title: discussion.title,
        community_id: discussion.community_id,
        community_name: discussion.communities?.name,
        expires_at: discussion.expires_at,
        is_expired: isAfter(new Date(), new Date(discussion.expires_at))
      });
    }
  }, [id, discussion, logDiscussionView]);

  // Real-time subscription for new comments
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('discussion-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussion_comments',
          filter: `discussion_id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['discussion-comments', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from('discussion_comments')
        .insert({
          discussion_id: id,
          user_id: user?.id,
          text,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['discussion-comments', id] });
      toast.success('Comment added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add comment');
      // Error adding comment - logging removed for security
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  // Flag comment mutation
  const flagCommentMutation = useMutation({
    mutationFn: async ({ commentId, commentUserId, reason }: { commentId: string; commentUserId: string; reason: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('flags')
        .insert({
          flagged_user_id: commentUserId,
          flagged_by_id: user.id,
          comment_id: commentId,
          reason: reason
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Log flag activity
      logCommentFlag(variables.commentId, variables.commentUserId, variables.reason);

      toast.success('Comment flagged successfully');
    },
    onError: (error) => {
      toast.error('Failed to flag comment');
      // Error flagging comment - logging removed for security
    },
  });

  const handleFlagComment = (commentId: string, commentUserId: string) => {
    if (!user) {
      toast.error('Please sign in to flag comments');
      return;
    }

    if (user.id === commentUserId) {
      toast.error('You cannot flag your own comment');
      return;
    }

    // Open the flag dialog
    setCommentToFlag({ id: commentId, userId: commentUserId });
    setFlagDialogOpen(true);
  };

  const handleFlagSubmit = (reason: string) => {
    if (!commentToFlag) return;

    flagCommentMutation.mutate({
      commentId: commentToFlag.id,
      commentUserId: commentToFlag.userId,
      reason
    });

    // Close dialog and reset state
    setFlagDialogOpen(false);
    setCommentToFlag(null);
  };

  const isExpired = discussion && new Date(discussion.expires_at) < new Date();
  const canComment = user && isMember && !isExpired;

  if (discussionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Discussion not found</h1>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <span>{discussion.communities?.name}</span>
            <span>•</span>
            <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
          </div>
          <h1 className="text-2xl font-bold">{discussion.title}</h1>
        </div>
      </div>

      {/* Discussion Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={discussion.users?.photo_url || ''} />
                <AvatarFallback>
                  {discussion.users?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{discussion.users?.name}</p>
                <p className="text-sm text-muted-foreground">Discussion starter</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isExpired && (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Expired
                </Badge>
              )}
              <Badge variant="outline">
                <MessageCircle className="w-3 h-3 mr-1" />
                {comments?.length || 0} comments
              </Badge>
            </div>
          </div>
        </CardHeader>
        {discussion.prompt && (
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{discussion.prompt}</p>
          </CardContent>
        )}
      </Card>

      {/* Comments Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Comments ({comments?.length || 0})
          </h2>
          {isExpired && (
            <p className="text-sm text-muted-foreground">
              Discussion expired on {new Date(discussion.expires_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Comment Form */}
        {isMember && !isExpired ? (
          <Card>
            <CardContent className="pt-6">
              <CommentForm discussionId={id!} />
            </CardContent>
          </Card>
        ) : !user ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Please sign in to participate in this discussion
              </p>
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            </CardContent>
          </Card>
        ) : !isMember ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                You need to be a member of this community to comment
              </p>
              <Button onClick={() => navigate(`/communities/${discussion.community_id}`)}>
                Join Community
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                This discussion has expired and is no longer accepting comments.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        {commentsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-muted rounded-full"></div>
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments?.length ? (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={comment.id}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.users?.photo_url || ''} />
                        <AvatarFallback>
                          {comment.users?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-sm">{comment.users?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()} at{' '}
                            {new Date(comment.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFlagComment(comment.id, comment.user_id)}
                        disabled={flagCommentMutation.isPending}
                        title="Flag comment"
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                {index < comments.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No comments yet. Be the first to start the conversation!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Flag Comment Dialog */}
      <FlagCommentDialog
        open={flagDialogOpen}
        onOpenChange={setFlagDialogOpen}
        onSubmit={handleFlagSubmit}
        isLoading={flagCommentMutation.isPending}
      />
    </div>
  );
}