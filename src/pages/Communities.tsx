import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Users, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Communities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: communities, isLoading } = useQuery({
    queryKey: ["communities", searchTerm, selectedCity],
    queryFn: async () => {
      let query = supabase
        .from("communities")
        .select(`
          *,
          community_members(count)
        `);

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }
      if (selectedCity) {
        query = query.eq("city", selectedCity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: cities } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("city")
        .order("city");
      if (error) throw error;
      return [...new Set(data.map(c => c.city))];
    },
  });

  const { data: userMemberships } = useQuery({
    queryKey: ["userMemberships", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map(m => m.community_id);
    },
    enabled: !!user,
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from("community_members")
        .insert({ community_id: communityId, user_id: user.id });

      if (error) throw error;
    },
    onMutate: async (communityId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["userMemberships", user?.id] });

      // Snapshot previous values
      const previousMemberships = queryClient.getQueryData(["userMemberships", user?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(["userMemberships", user?.id], (old: string[] | undefined) => {
        return old ? [...old, communityId] : [communityId];
      });

      // Show success toast immediately
      toast({
        title: "Success!",
        description: "You've joined the community",
      });

      return { previousMemberships };
    },
    onError: (err, communityId, context) => {
      // Rollback on error
      if (context?.previousMemberships !== undefined) {
        queryClient.setQueryData(["userMemberships", user?.id], context.previousMemberships);
      }

      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["userMemberships", user?.id] });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onMutate: async (communityId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["userMemberships", user?.id] });

      // Snapshot previous values
      const previousMemberships = queryClient.getQueryData(["userMemberships", user?.id]);

      // Optimistically update to the new value
      queryClient.setQueryData(["userMemberships", user?.id], (old: string[] | undefined) => {
        return old ? old.filter(id => id !== communityId) : [];
      });

      // Show success toast immediately
      toast({
        title: "Left community",
        description: "You've left the community",
      });

      return { previousMemberships };
    },
    onError: (err, communityId, context) => {
      // Rollback on error
      if (context?.previousMemberships !== undefined) {
        queryClient.setQueryData(["userMemberships", user?.id], context.previousMemberships);
      }

      toast({
        title: "Error",
        description: "Failed to leave community",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["userMemberships", user?.id] });
    },
  });

  const handleJoinCommunity = (communityId: string) => {
    if (!user) {
      navigate('/auth', {
        state: {
          from: { pathname: '/communities' },
          message: 'Please sign in to join communities'
        }
      });
      return;
    }
    joinCommunityMutation.mutate(communityId);
  };

  const handleLeaveCommunity = (communityId: string) => {
    leaveCommunityMutation.mutate(communityId);
  };

  const isUserMember = (communityId: string) => {
    return userMemberships?.includes(communityId) || false;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Discover Communities</h1>
          <p className="text-muted-foreground">
            Find and join communities that match your interests
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="">All Cities</option>
            {cities?.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities?.map((community) => (
            <Card key={community.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{community.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {community.city}
                    </div>
                  </div>
                  {community.image_url && (
                    <img
                      src={community.image_url}
                      alt={community.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-3">
                  {community.description}
                </CardDescription>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {community.community_members?.[0]?.count || 0} members
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link to={`/communities/${community.id}`}>
                        View
                      </Link>
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={user && isUserMember(community.id) ? "outline" : "default"}
                      onClick={() => {
                        if (!user) {
                          handleJoinCommunity(community.id);
                          return;
                        }
                        isUserMember(community.id)
                          ? handleLeaveCommunity(community.id)
                          : handleJoinCommunity(community.id);
                      }}
                      disabled={joinCommunityMutation.isPending || leaveCommunityMutation.isPending}
                    >
                      {(joinCommunityMutation.isPending || leaveCommunityMutation.isPending)
                        ? (user && isUserMember(community.id) ? "Leaving..." : "Joining...")
                        : (user && isUserMember(community.id) ? "Leave" : "Join")
                      }
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {communities?.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No communities found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}