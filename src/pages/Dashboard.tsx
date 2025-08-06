import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, MessageSquare, Star, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch user's registered events
  const { data: userEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          events (
            *,
            communities(name, city),
            event_tags(tags(name))
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data?.map(registration => ({
        ...registration.events,
        registration_status: registration.status,
        community_name: registration.events?.communities?.name,
        community_city: registration.events?.communities?.city,
        tags: registration.events?.event_tags?.map(et => et.tags?.name).filter(Boolean) || []
      })) || [];
    },
    enabled: !!user
  });

  // Fetch user's communities
  const { data: userCommunities = [], isLoading: communitiesLoading } = useQuery({
    queryKey: ['user-communities', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          joined_at,
          communities (
            *,
            community_members(id)
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      
      return data?.map(membership => ({
        ...membership.communities,
        joined_at: membership.joined_at,
        member_count: membership.communities?.community_members?.length || 0
      })) || [];
    },
    enabled: !!user
  });

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = userEvents.filter(event => new Date(event.date_time) > now);
  const pastEvents = userEvents.filter(event => new Date(event.date_time) <= now);

  if (eventsLoading || communitiesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.user_metadata?.name || user?.email}!
        </h1>
        <p className="text-muted-foreground">
          Here's your community activity and upcoming events
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{userCommunities.length}</div>
            <div className="text-sm text-muted-foreground">Communities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{pastEvents.length}</div>
            <div className="text-sm text-muted-foreground">Events Attended</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">
              {userCommunities.reduce((total, community) => total + community.member_count, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Connections</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Upcoming Events</h2>
          <Button variant="outline" asChild>
            <Link to="/events">Browse More Events</Link>
          </Button>
        </div>
        
        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven't registered for any upcoming events yet
              </p>
              <Button asChild>
                <Link to="/events">Discover Events</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {upcomingEvents.slice(0, 4).map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge variant={event.registration_status === 'success' ? 'default' : 'secondary'}>
                      {event.registration_status}
                    </Badge>
                  </div>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {format(new Date(event.date_time), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.venue}
                    </div>
                  </div>
                  {event.community_name && (
                    <div className="text-sm text-muted-foreground">
                      by {event.community_name} • {event.community_city}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {event.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/events/${event.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* My Communities */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">My Communities</h2>
          <Button variant="outline" asChild>
            <Link to="/communities">Explore Communities</Link>
          </Button>
        </div>
        
        {userCommunities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven't joined any communities yet
              </p>
              <Button asChild>
                <Link to="/communities">Find Communities</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCommunities.map((community) => (
              <Card key={community.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                  <CardDescription>{community.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {community.member_count} members
                    </div>
                    <Badge>{community.city}</Badge>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/communities/${community.id}`}>View Community</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;