'use client';

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, RefreshCcw, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { SilkBackground, SpotlightCard, CommunityCarousel } from "@/components/reactbits";
import { GalleryDisplay, GalleryMediaItem } from "@/components/GalleryDisplay";
import { useStructuredData, websiteSchema, organizationSchema, createCollectionSchema } from "@/utils/schema";
import type { CommunityListItem, EventListItem } from "@/lib/supabase/server";
import { useNavigate } from "@/lib/nextRouterAdapter";

interface IndexProps {
  initialCommunities?: CommunityListItem[];
  initialEvents?: EventListItem[];
}

const Index = ({ initialCommunities, initialEvents }: IndexProps = {}) => {
  const {
    user
  } = useAuth();
  const {
    logPageView
  } = useActivityLogger();
  const navigate = useNavigate();
  const [communitiesPage, setCommunitiesPage] = useState(0);
  const [allCommunities, setAllCommunities] = useState<any[]>([]);
  const [hasMoreCommunities, setHasMoreCommunities] = useState(true);

  // Intersection Observer sentinel for infinite scroll (no extra components)
  const sentinelRef = (node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMoreCommunities && !loadingCommunities) {
        loadMoreCommunities();
      }
    }, { rootMargin: '200px 0px 0px 0px' });
    observer.observe(node);
  };

  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [masonryColumns, setMasonryColumns] = useState(3);

  // Page size for communities pagination
  const PAGE_SIZE = 6;

  useEffect(() => {
    logPageView('home');
  }, [logPageView]);

  // Add structured data for SEO (use static URL to avoid SSR issues with window)
  useStructuredData([
    websiteSchema,
    organizationSchema,
    createCollectionSchema({
      name: "Communities on My Third Place",
      description: "Discover and join communities based on your interests",
      url: typeof window !== 'undefined' ? window.location.href : 'https://thethirdplace.community',
      numberOfItems: allCommunities.length
    })
  ]);

  // Handle responsive masonry columns
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMasonryColumns(1);
      } else if (window.innerWidth < 1024) {
        setMasonryColumns(2);
      } else {
        setMasonryColumns(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Features data for SpotlightCard
  const features = [{
    icon: <Zap className="w-6 h-6" />,
    title: "Recharge",
    description: "Take time to relax, unwind, and restore your energy with like-minded people in your community."
  }, {
    icon: <RefreshCcw className="w-6 h-6" />,
    title: "Adapt",
    description: "Embrace change, learn new skills, and grow through diverse experiences and connections."
  }, {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Prosper",
    description: "Thrive together, achieve your goals, and unlock your full potential with community support."
  }];

  // Fetch gallery media from DB
  const [galleryMedia, setGalleryMedia] = useState<GalleryMediaItem[]>([
    {
      id: 'fallback-1',
      media_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
      mimetype: 'image/jpeg',
      alt: 'Community Gathering'
    },
    {
      id: 'fallback-2',
      media_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400',
      mimetype: 'image/jpeg',
      alt: 'Local Event'
    },
    {
      id: 'fallback-3',
      media_url: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400',
      mimetype: 'image/jpeg',
      alt: 'Workshop Session'
    },
    {
      id: 'fallback-4',
      media_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400',
      mimetype: 'image/jpeg',
      alt: 'Community Meeting'
    }
  ]);

  useEffect(() => {
    const fetchGalleryMedia = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery_media')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (data && data.length > 0) {
          setGalleryMedia(data.map(item => ({
            id: item.id,
            media_url: item.media_url,
            mimetype: item.mimetype,
            alt: 'Community memory'
          })));
        }
      } catch (error) {
        console.error('Error fetching gallery media:', error);
      }
    };
    fetchGalleryMedia();
  }, []);

  // Fetch featured events with registration counts (skip if SSR data available)
  const {
    data: fetchedEvents = []
  } = useQuery({
    queryKey: ['featured-events'],
    queryFn: async () => {
      const {
        data: events,
        error
      } = await supabase.from('events').select(`
          *,
          communities(name),
          event_registrations(id)
        `).eq('is_cancelled', false).order('date_time', {
        ascending: true,
        nullsFirst: false
      }).limit(4);
      if (error) throw error;
      const filteredEvents = events?.filter(event =>
        !event.date_time || new Date(event.date_time) >= new Date()
      ) || [];
      return filteredEvents.map(event => ({
        ...event,
        community_name: event.communities?.name,
        attendees: event.event_registrations?.length || 0
      })) || [];
    },
    enabled: !initialEvents || initialEvents.length === 0,
  });

  const featuredEvents = (initialEvents && initialEvents.length > 0)
    ? initialEvents.map(event => ({
      ...event,
      community_name: event.communities?.name,
      attendees: event.event_registrations?.[0]?.count || 0
    }))
    : fetchedEvents;

  // Fetch communities (initial page) - skip if SSR data available
  const { data: fetchedCommunities = [] } = useQuery({
    queryKey: ['featured-communities'],
    queryFn: async () => {
      const { data: communities, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);
      if (error) throw error;
      const mappedCommunities =
        communities?.map((community) => ({
          ...community,
          members: community.member_count || 0,
        })) || [];
      return mappedCommunities;
    },
    enabled: !initialCommunities || initialCommunities.length === 0,
  });

  const featuredCommunities = useMemo(() => {
    if (initialCommunities && initialCommunities.length > 0) {
      return initialCommunities.map(community => ({
        ...community,
        members: community.member_count || 0,
      }));
    }
    return fetchedCommunities;
  }, [initialCommunities, fetchedCommunities]);

  const hasSeededInitialData = useRef(false);

  useEffect(() => {
    if (!hasSeededInitialData.current && featuredCommunities && featuredCommunities.length > 0) {
      hasSeededInitialData.current = true;
      setAllCommunities(featuredCommunities);
      setCommunitiesPage(1);
      setHasMoreCommunities(featuredCommunities.length === PAGE_SIZE);
    }
  }, [featuredCommunities]);


  // Load more communities function for infinite scroll
  const loadMoreCommunities = useCallback(async () => {
    if (loadingCommunities || !hasMoreCommunities) return;
    setLoadingCommunities(true);
    try {
      const { data: communities, error } = await supabase
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })
        .range(communitiesPage * PAGE_SIZE, (communitiesPage + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      const mappedCommunities =
        communities?.map((community) => ({
          ...community,
          members: community.member_count || 0,
        })) || [];

      setAllCommunities((prev) => {
        const existingIds = new Set(prev.map((c: any) => c.id));
        const newOnes = mappedCommunities.filter((c: any) => !existingIds.has(c.id));
        if (mappedCommunities.length < PAGE_SIZE || newOnes.length === 0) {
          setHasMoreCommunities(false);
        }
        return [...prev, ...newOnes];
      });

      setCommunitiesPage((prev) => prev + 1);
    } catch (error) {
      // Error loading more communities
    } finally {
      setLoadingCommunities(false);
    }
  }, [communitiesPage, hasMoreCommunities, loadingCommunities]);

  return <SilkBackground>
    <div className="min-h-screen mobile-safe overflow-x-hidden flex flex-col">
      {/* Hero Section - Neo-Brutalism */}
      <div className="flex-grow flex flex-col md:flex-row items-center justify-center max-w-[90rem] mx-auto pt-6 md:pt-8 pb-8 md:pb-12 px-6 md:px-12 xl:px-20 gap-8 lg:gap-12 xl:gap-20 min-h-0 md:min-h-[80vh] w-full">

        {/* Logo - Left on desktop, centered on mobile */}
        <div className="flex-shrink-0 flex justify-center w-full md:w-5/12 lg:w-4/12 xl:w-5/12 md:justify-end lg:justify-end">
          <img src="/logo.png" alt="My Third Place" className="h-[12rem] sm:h-[14rem] md:h-[20rem] lg:h-[28rem] xl:h-[32rem] w-auto max-h-[35vh] md:max-h-none drop-shadow-sm" loading="eager" decoding="async" />
        </div>

        {/* Text Content - Right on desktop, centered on mobile */}
        <div className="text-center md:text-left flex-1 max-w-xl md:max-w-3xl lg:max-w-[45rem] xl:max-w-[55rem] flex flex-col items-center md:items-start">
          <div className="space-y-4 md:space-y-6 text-foreground leading-[1.1] mb-8 md:mb-10 w-full">
            <h1 className="text-4xl sm:text-5xl md:text-[3rem] lg:text-[4rem] xl:text-[4.25rem] font-bold uppercase tracking-tight">
              We believe that <br className="hidden md:block lg:hidden" />everyone needs a Thirdplace.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-foreground/80 leading-relaxed md:leading-snug max-w-lg md:max-w-full mx-auto md:mx-0">
              We bring together people and spaces to create meaningful experiences.
            </p>
          </div>

          {/* Primary CTAs - Neo-Brutal buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center md:justify-start items-center">
            {user ? (
              <Button size="lg" className="bg-accent text-accent-foreground text-base sm:text-lg px-8 py-3 sm:py-4 w-full sm:w-auto shadow-brutal hover:translate-y-[2px] hover:shadow-none transition-all" onClick={() => navigate('/dashboard')}>
                View Dashboard
              </Button>
            ) : (
              <Button size="lg" className="bg-primary text-primary-foreground text-base sm:text-lg px-8 py-3 sm:py-4 w-full sm:w-auto shadow-brutal hover:translate-y-[2px] hover:shadow-none transition-all" onClick={() => navigate('/auth')}>
                Find Yours With Us
              </Button>
            )}
            <Button variant="outline" size="lg" className="bg-secondary text-secondary-foreground text-base sm:text-lg px-8 py-3 sm:py-4 w-full sm:w-auto border-2 border-foreground shadow-brutal hover:translate-y-[2px] hover:shadow-none transition-all" onClick={() => navigate('/communities')}>
              Explore Spaces
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 pb-16 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const colors = ['bg-accent', 'bg-primary', 'bg-secondary', 'bg-[#ADFF2F]'];
            return (
              <Card key={index} className={`${colors[index % colors.length]} border-2 border-foreground shadow-brutal text-black`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background border-2 border-foreground">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl text-black">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-black/70 text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Community Header */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 pt-8 md:pt-12 pb-6 md:pb-8">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase">
            Our Communities
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Discover vibrant communities in your area and connect with like-minded people
          </p>
        </div>
      </div>

      {/* Community Scroll Carousel */}
      <div className="pb-16 md:pb-20">
        <div className="px-2 sm:px-4">
          <CommunityCarousel communities={allCommunities} />
        </div>

        {hasMoreCommunities && <div className="text-center mt-8 md:mt-12 px-6 md:px-8">
          <Button variant="outline" onClick={loadMoreCommunities} disabled={loadingCommunities} className="text-base sm:text-lg px-6 sm:px-8 py-2 w-full sm:w-auto min-w-[200px]">
            {loadingCommunities ? "Loading..." : "Load More Communities"}
          </Button>

          {hasMoreCommunities && (
            <div className="h-1" ref={sentinelRef} />
          )}

        </div>}
      </div>

      {/* Gallery */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 pb-16 md:pb-20">
        <GalleryDisplay
          media={galleryMedia}
          title="Community Moments"
          subtitle="Capturing the spirit of connection and shared experiences in our communities"
        />
      </div>

      {/* Secondary CTA */}
      <div className="container mx-auto px-6 md:px-8 lg:px-12 pb-16 md:pb-20">
        <div className="text-center space-y-6 md:space-y-8 bg-accent border-2 border-foreground shadow-brutal-lg p-8 sm:p-10 md:p-16 text-black">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent-foreground uppercase">
            Ready to find your Third Place?
          </h2>
          <p className="text-base sm:text-lg text-black/70 max-w-3xl mx-auto leading-relaxed">
            Join thousands of people who have discovered meaningful connections and exciting opportunities in their local communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Button size="lg" className="bg-foreground text-background text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 w-full sm:w-auto min-w-[180px]" onClick={() => navigate('/communities')}>
              Explore Communities
            </Button>
            <Button variant="outline" size="lg" className="bg-background text-foreground text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 w-full sm:w-auto min-w-[180px]" onClick={() => navigate('/events')}>
              Browse Events
            </Button>
          </div>
        </div>
      </div>
    </div>
  </SilkBackground>;
};
export default Index;