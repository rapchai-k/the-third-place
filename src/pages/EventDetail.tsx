import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Users, Clock, ArrowLeft, User } from "lucide-react";
import { EventRegistrationButton } from "@/components/EventRegistrationButton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          communities(id, name, city),
          event_registrations(count),
          event_tags(
            tags(name)
          ),
          users!events_host_id_fkey(name, photo_url)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: userRegistration, refetch: refetchRegistration } = useQuery({
    queryKey: ["userRegistration", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .single();
      return error ? null : data;
    },
    enabled: !!user && !!id,
  });

  const handleRegister = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to register for events",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("event_registrations")
        .insert({ 
          event_id: id!, 
          user_id: user.id,
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Registration submitted!",
        description: "Your registration is pending confirmation",
      });
      refetchRegistration();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register for event",
        variant: "destructive",
      });
    }
  };

  const handleCancelRegistration = async () => {
    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Registration cancelled",
        description: "You've cancelled your registration",
      });
      refetchRegistration();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel registration",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-96 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="text-muted-foreground mt-2">
            The event you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link to="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date_time);
  const isPastEvent = eventDate < new Date();
  const registrationCount = event.event_registrations?.[0]?.count || 0;
  const isFull = registrationCount >= event.capacity;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-2">
                  {event.event_tags?.map((et, index) => (
                    <Badge key={index} variant="outline">
                      {et.tags?.name}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="text-3xl">{event.title}</CardTitle>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {format(eventDate, "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {format(eventDate, "h:mm a")}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.venue}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {event.users && (
              <Card>
                <CardHeader>
                  <CardTitle>Event Host</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    {event.users.photo_url ? (
                      <img
                        src={event.users.photo_url}
                        alt={event.users.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{event.users.name}</p>
                      <Badge variant="secondary">Host</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {registrationCount}/{event.capacity}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Community</span>
                  <Link 
                    to={`/communities/${event.communities?.id}`}
                    className="text-primary hover:underline"
                  >
                    {event.communities?.name}
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isPastEvent ? "secondary" : "default"}>
                    {isPastEvent ? "Past Event" : "Upcoming"}
                  </Badge>
                </div>

                {userRegistration && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your Status</span>
                    <Badge 
                      variant={
                        userRegistration.status === "success" ? "default" :
                        userRegistration.status === "pending" ? "secondary" : 
                        "destructive"
                      }
                    >
                      {userRegistration.status}
                    </Badge>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <EventRegistrationButton
                    eventId={event.id}
                    eventDate={event.date_time}
                    capacity={event.capacity}
                    currentAttendees={registrationCount}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Explore More</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link to={`/communities/${event.communities?.id}`}>
                    View Community
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link to="/events">
                    Browse All Events
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}