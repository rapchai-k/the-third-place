'use client';

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users, Clock, ArrowLeft, User } from "lucide-react";
import { EventRegistrationButton } from "@/components/EventRegistrationButton";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useEffect } from "react";
import { Link } from "@/lib/nextRouterAdapter";
import type { EventWithRelations } from "@/lib/supabase/server";

interface EventDetailClientProps {
  event: EventWithRelations;
}

export default function EventDetailClient({ event }: EventDetailClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logEventView, logEventRegistration } = useActivityLogger();

  // Client-side query for user's registration status (user-specific data)
  const { data: userRegistration, refetch: refetchRegistration } = useQuery({
    queryKey: ["userRegistration", event.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Client-side query for live registration count (can be stale from SSR)
  const { data: liveRegistrationCount } = useQuery({
    queryKey: ["eventRegistrationCount", event.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);
      if (error) throw error;
      return count || 0;
    },
    initialData: event.event_registrations?.[0]?.count || 0,
    staleTime: 30000, // Consider fresh for 30 seconds
  });

  const registrationCount = liveRegistrationCount;

  useEffect(() => {
    logEventView(event.id, {
      event_title: event.title,
      event_date: event.date_time,
      community_id: event.community_id,
      community_name: event.communities?.name,
      community_city: event.communities?.city,
      event_price: event.price || 0,
      event_capacity: event.capacity,
      current_attendees: registrationCount,
      user_is_registered: !!userRegistration
    });
  }, [event.id, logEventView, registrationCount, userRegistration]);

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
      // First, check if user is a community member
      const { data: membership } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", event.community_id)
        .eq("user_id", user.id)
        .maybeSingle();

      // If not a member, join the community first
      if (!membership) {
        const { error: joinError } = await supabase
          .from("community_members")
          .insert({
            community_id: event.community_id,
            user_id: user.id
          });

        if (joinError) throw joinError;
      }

      // Now register for the event
      const { error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: "registered"
        });

      if (error) throw error;

      logEventRegistration(event.id, {
        event_title: event.title,
        event_date: event.date_time,
        community_id: event.community_id,
        community_name: event.communities?.name,
        registration_type: 'free'
      });

      toast({
        title: "Registration successful!",
        description: membership
          ? "You've registered for the event"
          : "You've joined the community and registered for the event",
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

  const eventDate = event.date_time ? new Date(event.date_time) : null;
  const isPastEvent = eventDate ? eventDate < new Date() : false;
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
          {/* Main Content - Left Column */}
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
                <CardTitle className="text-3xl">{event.title || "TBD"}</CardTitle>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {eventDate ? format(eventDate, "EEEE, MMMM d, yyyy") : "TBD"}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {eventDate ? format(eventDate, "h:mm a") : "TBD"}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.venue || "TBD"}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {event.description || "TBD"}
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

          {/* Sidebar - Right Column */}
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
                    {event.communities?.name || "TBD"}
                  </Link>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isPastEvent ? "secondary" : "default"}>
                    {isPastEvent ? "Past Event" : "Upcoming"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">
                    {event.price && event.price > 0 ? `₹${event.price}` : "Free"}
                  </span>
                </div>

                {userRegistration && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your Status</span>
                    <Badge
                      variant={
                        userRegistration.status === "registered" ? "default" :
                        "destructive"
                      }
                      className={userRegistration.status === "registered" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {userRegistration.status === "registered" ? "Confirmed" : userRegistration.status}
                    </Badge>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <EventRegistrationButton
                    eventId={event.id}
                    eventDate={event.date_time}
                    capacity={event.capacity}
                    currentAttendees={registrationCount}
                    eventTitle={event.title}
                    communityId={event.community_id}
                    communityName={event.communities?.name}
                    price={event.price}
                    currency={event.currency}
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

