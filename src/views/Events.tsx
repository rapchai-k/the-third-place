'use client';

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/nextRouterAdapter";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Calendar, MapPin, Users, Clock, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useStructuredData, createCollectionSchema, createBreadcrumbSchema } from "@/utils/schema";
import { useAuth } from "@/contexts/AuthContext";
import type { EventListItem } from "@/lib/supabase/server";

// SSR-safe helper to get the base URL
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || '';
};

interface EventsProps {
  initialEvents?: EventListItem[];
}

export default function Events({ initialEvents }: EventsProps = {}) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Add structured data for SEO (memoized to avoid recalculating on every render)
  const breadcrumbSchema = useMemo(() => {
    const baseUrl = getBaseUrl();
    return createBreadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "Events", url: `${baseUrl}/events` }
    ]);
  }, []);

  useStructuredData([breadcrumbSchema]);

  // Sanitize search term to prevent PostgREST injection
  const sanitizeSearchTerm = (term: string): string => {
    // Escape special characters that could be used for injection
    // PostgREST uses these for operators: ., (, ), ,, :, *, %
    return term.replace(/[.(),:%*\\]/g, '');
  };

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", searchTerm, selectedTag, selectedCity],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select(`
          *,
          communities(name, city),
          event_registrations(count),
          event_tags(
            tags(name)
          )
        `)
        .eq("is_cancelled", false)
        .order("date_time", { ascending: true, nullsFirst: false });

      if (searchTerm) {
        const sanitized = sanitizeSearchTerm(searchTerm);
        if (sanitized) {
          query = query.ilike("title", `%${sanitized}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by tag and city client-side for now
      let filteredData = data || [];

      // Include events with null dates or future dates
      filteredData = filteredData.filter(event =>
        !event.date_time || new Date(event.date_time) >= new Date()
      );

      if (selectedTag) {
        filteredData = filteredData.filter(event =>
          event.event_tags?.some(et => et.tags?.name === selectedTag)
        );
      }

      if (selectedCity) {
        filteredData = filteredData.filter(event =>
          event.communities?.city === selectedCity
        );
      }

      return filteredData;
    },
    // Use SSR data as initial data (avoids loading state on first render)
    initialData: initialEvents,
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("name")
        .order("name");
      if (error) throw error;
      return data.map(t => t.name);
    },
  });

  const { data: cities } = useQuery({
    queryKey: ["eventCities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("date_time, communities(city)")
        .eq("is_cancelled", false);
      if (error) throw error;
      // Include events with null dates or future dates
      const filteredData = data.filter(e =>
        !e.date_time || new Date(e.date_time) >= new Date()
      );
      return [...new Set(filteredData.map(e => e.communities?.city).filter(Boolean))];
    },
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
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
          <h1 className="text-3xl font-bold">Upcoming Events</h1>
          <p className="text-muted-foreground">
            Discover and register for events in your community
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 pr-12 border rounded-md bg-background appearance-none cursor-pointer w-full"
            >
              <option value="">All Tags</option>
              {tags?.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 pr-12 border rounded-md bg-background appearance-none cursor-pointer w-full"
            >
              <option value="">All Cities</option>
              {cities?.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event) => {
            const isRegistered = registeredEventIds.has(event.id);

            return (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col relative">
                  {/* Registration Status Badge - Top Right */}
                  {user && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge
                        className={
                          isRegistered
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                        }
                      >
                        {isRegistered ? "Registered" : "Unregistered"}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2 mb-3 pr-24">{event.title || "TBD"}</CardTitle>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{event.date_time ? format(new Date(event.date_time), "MMM d, yyyy") : "TBD"}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{event.date_time ? format(new Date(event.date_time), "h:mm a") : "TBD"}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-1">{event.venue || "TBD"}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col space-y-4">
                    <CardDescription className="line-clamp-3 flex-grow" style={{ height: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.description || "TBD"}
                    </CardDescription>

                    <div className="flex flex-wrap gap-2">
                      {event.event_tags?.map((et, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {et.tags?.name}
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Users className="h-3 w-3" />
                        {event.event_registrations?.[0]?.count || 0}/{event.capacity}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        by {event.communities?.name || "TBD"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {events?.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No events found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}