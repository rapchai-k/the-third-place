import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const Index = () => {
  const { user } = useAuth();

  // Fetch featured events with registration counts
  const { data: featuredEvents = [] } = useQuery({
    queryKey: ['featured-events'],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          *,
          communities(name),
          event_tags(tags(name)),
          event_registrations(id)
        `)
        .eq('is_cancelled', false)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(4);

      if (error) throw error;
      
      return events?.map(event => ({
        ...event,
        community_name: event.communities?.name,
        tags: event.event_tags?.map(et => et.tags?.name).filter(Boolean) || [],
        attendees: event.event_registrations?.length || 0
      })) || [];
    }
  });

  // Fetch featured communities with member counts
  const { data: featuredCommunities = [] } = useQuery({
    queryKey: ['featured-communities'],
    queryFn: async () => {
      const { data: communities, error } = await supabase
        .from('communities')
        .select(`
          *,
          community_members(count)
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      return communities?.map(community => ({
        ...community,
        members: community.community_members?.[0]?.count || 0
      })) || [];
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Discover Your {" "}
          <span className="text-primary">Third Place</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with local communities, discover exciting events, and build meaningful relationships in your neighborhood
        </p>
        {user ? (
          <Button size="lg" className="mt-4" onClick={() => window.location.href = '/dashboard'}>
            View Your Dashboard
          </Button>
        ) : (
          <Button size="lg" className="mt-4" onClick={() => window.location.href = '/auth'}>
            Join the Community
          </Button>
        )}
      </div>

      {/* Featured Events */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Featured Events</h2>
          <Button variant="outline" onClick={() => window.location.href = '/events'}>View All Events</Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {featuredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Star className="w-5 h-5 text-muted-foreground" />
                </div>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    {format(new Date(event.date_time), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {event.attendees} attending
                  </div>
                </div>
                <div className="flex gap-2">
                  {event.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                {event.community_name && (
                  <div className="text-sm text-muted-foreground">
                    Hosted by {event.community_name}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Communities */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Active Communities</h2>
          <Button variant="outline" onClick={() => window.location.href = '/communities'}>Explore Communities</Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {featuredCommunities.map((community) => (
            <Card key={community.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{community.name}</CardTitle>
                <CardDescription>{community.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {community.members} members
                  </div>
                  <Badge>{community.city}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      {user && (
        <section className="text-center space-y-4 py-8">
          <h2 className="text-2xl font-semibold text-foreground">
            Ready to get involved?
          </h2>
          <p className="text-muted-foreground">
            Start by joining a community or attending an event near you
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.href = '/events'}>Browse Events</Button>
            <Button variant="outline" onClick={() => window.location.href = '/communities'}>Find Communities</Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
