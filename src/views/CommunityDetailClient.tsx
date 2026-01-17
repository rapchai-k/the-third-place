'use client';

import { useParams, useNavigate, Link } from "@/lib/nextRouterAdapter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar, MessageSquare, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { format } from "date-fns";
import type { CommunityWithRelations } from "@/lib/supabase/server";

interface CommunityDetailClientProps {
  initialCommunity: CommunityWithRelations;
}

export default function CommunityDetailClient({ initialCommunity }: CommunityDetailClientProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logCommunityJoin, logCommunityLeave, logCommunityView } = useActivityLogger();

  // Use initialCommunity as initial data for hydration
  const { data: community } = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select(`
          *,
          community_members(count)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    initialData: initialCommunity,
    staleTime: 1000 * 60, // Consider data fresh for 1 minute
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ["communityEvents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_registrations(count)
        `)
        .eq("community_id", id)
        .eq("is_cancelled", false)
        .order("date_time", { ascending: true, nullsFirst: false })
        .limit(3);
      if (error) throw error;
      // Filter to include events with null dates or future dates
      const filteredData = data?.filter(event =>
        !event.date_time || new Date(event.date_time) >= new Date()
      ) || [];
      return filteredData;
    },
    enabled: !!id,
  });

  // Fetch user's event registrations
  const { data: userRegistrations = [] } = useQuery({
    queryKey: ['user-registrations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id, status')
        .eq('user_id', user.id)
        .eq('status', 'registered');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  // Create a Set of registered event IDs for quick lookup
  const registeredEventIds = new Set(userRegistrations.map(reg => reg.event_id));

  const { data: discussions } = useQuery({
    queryKey: ["communityDiscussions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discussions")
        .select(`
          *,
          discussion_comments(count)
        `)
        .eq("community_id", id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Log community view when community data is loaded
  useEffect(() => {
    if (id && community) {
      logCommunityView(id, {
        community_name: community.name,
        community_city: community.city,
        member_count: community.community_members?.[0]?.count || 0
      });
    }
  }, [id, community, logCommunityView]);

  const { data: isMember, refetch: refetchMembership } = useQuery({
    queryKey: ["isMember", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        return false;
      }
      
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from("community_members")
        .insert({ community_id: id!, user_id: user.id });

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["isMember", id, user?.id] });
      await queryClient.cancelQueries({ queryKey: ["community", id] });

      const previousMembership = queryClient.getQueryData(["isMember", id, user?.id]);
      const previousCommunity = queryClient.getQueryData(["community", id]);

      queryClient.setQueryData(["isMember", id, user?.id], true);

      if (previousCommunity) {
        queryClient.setQueryData(["community", id], (old: any) => ({
          ...old,
          community_members: [{
            count: (old.community_members?.[0]?.count || 0) + 1
          }]
        }));
      }

      if (community) {
        logCommunityJoin(id!, {
          community_name: community.name,
          community_city: community.city,
          member_count: community.community_members?.[0]?.count || 0
        });
      }

      toast({
        title: "You've joined!",
        description: "Welcome to the community",
      });

      return { previousMembership, previousCommunity };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembership !== undefined) {
        queryClient.setQueryData(["isMember", id, user?.id], context.previousMembership);
      }
      if (context?.previousCommunity !== undefined) {
        queryClient.setQueryData(["community", id], context.previousCommunity);
      }

      toast({
        title: "Failed to join",
        description: "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["isMember", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["community", id] });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["isMember", id, user?.id] });
      await queryClient.cancelQueries({ queryKey: ["community", id] });

      const previousMembership = queryClient.getQueryData(["isMember", id, user?.id]);
      const previousCommunity = queryClient.getQueryData(["community", id]);

      queryClient.setQueryData(["isMember", id, user?.id], false);

      if (previousCommunity) {
        queryClient.setQueryData(["community", id], (old: any) => ({
          ...old,
          community_members: [{
            count: Math.max((old.community_members?.[0]?.count || 0) - 1, 0)
          }]
        }));
      }

      if (community) {
        logCommunityLeave(id!, {
          community_name: community.name,
          community_city: community.city,
          member_count: community.community_members?.[0]?.count || 0
        });
      }

      toast({
        title: "Left community",
        description: "You've left the community",
      });

      return { previousMembership, previousCommunity };
    },
    onError: (err, variables, context) => {
      if (context?.previousMembership !== undefined) {
        queryClient.setQueryData(["isMember", id, user?.id], context.previousMembership);
      }
      if (context?.previousCommunity !== undefined) {
        queryClient.setQueryData(["community", id], context.previousCommunity);
      }

      toast({
        title: "Failed to leave",
        description: "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["isMember", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["community", id] });
    },
  });

  const handleJoinCommunity = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join communities",
        variant: "destructive",
      });
      return;
    }
    joinCommunityMutation.mutate();
  };

  const handleLeaveCommunity = () => {
    leaveCommunityMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/communities">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Link>
        </Button>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <CardTitle className="text-3xl">{community.name}</CardTitle>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {community.city}
                </div>
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <Users className="h-3 w-3" />
                  {community.community_members?.[0]?.count || 0} members
                </Badge>
              </div>

              {community.image_url && (
                <img
                  src={community.image_url}
                  alt={community.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {community.description}
            </p>

            {user ? (
              <div className="space-y-2">
                <Button
                  onClick={isMember ? handleLeaveCommunity : handleJoinCommunity}
                  variant={isMember ? "outline" : "default"}
                  className="w-full md:w-auto"
                  disabled={joinCommunityMutation.isPending || leaveCommunityMutation.isPending}
                >
                  {(joinCommunityMutation.isPending || leaveCommunityMutation.isPending)
                    ? (isMember ? "Leaving..." : "Joining...")
                    : (isMember ? "Leave Community" : "Join Community")
                  }
                </Button>
              </div>
            ) : (
              <Button
                variant="gradient"
                className="w-full md:w-auto"
                onClick={() => navigate('/auth')}
              >
                Sign in to join community
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents?.length === 0 ? (
                <p className="text-muted-foreground">No upcoming events</p>
              ) : (
                upcomingEvents?.map((event) => {
                  const isRegistered = registeredEventIds.has(event.id);

                  return (
                    <div key={event.id} className="border-l-4 border-primary pl-4 relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Link
                            to={`/events/${event.id}`}
                            className="font-medium hover:underline"
                          >
                            {event.title}
                          </Link>
                          <div className="text-sm text-muted-foreground">
                            {event.date_time ? format(new Date(event.date_time), "MMM d, yyyy 'at' h:mm a") : "TBD"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.event_registrations?.[0]?.count || 0}/{event.capacity} registered
                          </div>
                        </div>
                        {user && (
                          <Badge
                            className={
                              isRegistered
                                ? "bg-green-600 hover:bg-green-700 text-white text-xs"
                                : "bg-yellow-500 hover:bg-yellow-600 text-gray-900 text-xs"
                            }
                          >
                            {isRegistered ? "Registered" : "Unregistered"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <Button variant="outline" asChild className="w-full">
                <Link to={`/events?community=${community.id}`}>
                  View All Events
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Discussions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {discussions?.length === 0 ? (
                <p className="text-muted-foreground">No active discussions</p>
              ) : (
                discussions?.map((discussion) => (
                  <div key={discussion.id} className="border-l-4 border-primary pl-4">
                    <Link
                      to={`/discussions/${discussion.id}`}
                      className="font-medium hover:underline"
                    >
                      {discussion.title}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {discussion.discussion_comments?.[0]?.count || 0} comments
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires {format(new Date(discussion.expires_at), "MMM d, yyyy")}
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" asChild className="w-full">
                <Link to={`/discussions?community=${community.id}`}>
                  View All Discussions
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
