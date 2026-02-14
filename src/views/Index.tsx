'use client';

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Search, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { SilkBackground, SpotlightCard, Masonry, CommunityCarousel } from "@/components/reactbits";
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
    icon: <Heart className="w-6 h-6" />,
    title: "Connect",
    description: "Build meaningful relationships with like-minded people in your community"
  }, {
    icon: <Search className="w-6 h-6" />,
    title: "Discover",
    description: "Find exciting events, activities, and opportunities happening around you"
  }, {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Engage",
    description: "Participate in discussions, share experiences, and contribute to your community"
  }];

  // Photo gallery data for Masonry - Using Supabase bucket for landing page images
  const [galleryImages, setGalleryImages] = useState([{
    id: '1',
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
    alt: 'Community Gathering',
    height: 250
  }, {
    id: '2',
    src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400',
    alt: 'Local Event',
    height: 300
  }, {
    id: '3',
    src: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400',
    alt: 'Workshop Session',
    height: 200
  }, {
    id: '4',
    src: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400',
    alt: 'Community Meeting',
    height: 280
  }, {
    id: '5',
    src: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400',
    alt: 'Social Activity',
    height: 220
  }, {
    id: '6',
    src: 'https://images.unsplash.com/photo-1543269664-647b4d4c4c2e?w=400',
    alt: 'Group Discussion',
    height: 260
  }, {
    id: '7',
    src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400',
    alt: 'Team Building',
    height: 240
  }, {
    id: '8',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    alt: 'Community Service',
    height: 290
  }]);

  // Fetch images from Supabase bucket when available
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const {
          data: files,
          error
        } = await supabase.storage.from('landing-page-images').list('', {
          limit: 20
        });
        if (error) {
          return;
        }
        if (files && files.length > 0) {
          const bucketImages = files.map((file, index) => ({
            id: file.id || `bucket-${index}`,
            src: supabase.storage.from('landing-page-images').getPublicUrl(file.name).data.publicUrl,
            alt: file.name.replace(/\.[^/.]+$/, "").replace(/-|_/g, " "),
            height: 200 + Math.floor(Math.random() * 100)
          }));
          setGalleryImages(bucketImages);
        }
      } catch (error) {
        // Error loading gallery images
      }
    };
    fetchGalleryImages();
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
          event_tags(tags(name)),
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
        tags: event.event_tags?.map(et => et.tags?.name).filter(Boolean) || [],
        attendees: event.event_registrations?.length || 0
      })) || [];
    },
    enabled: !initialEvents || initialEvents.length === 0,
  });

  const featuredEvents = (initialEvents && initialEvents.length > 0)
    ? initialEvents.map(event => ({
      ...event,
      community_name: event.communities?.name,
      tags: event.event_tags?.map(et => et.tags?.name).filter(Boolean) || [],
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
    <div className="min-h-screen mobile-safe overflow-x-hidden">
      {/* Hero Section - Neo-Brutalism */}
      <div className="text-center pt-12 md:pt-20 pb-6 px-6 md:px-8">
        <img src="/logo.png" alt="My Third Place" className="h-[10rem] sm:h-[12rem] md:h-[16rem] lg:h-[20rem] w-auto mx-auto" loading="eager" decoding="async" />
      </div>

      {/* Bold Tagline */}
      <div className="text-center px-6 md:px-8 pb-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground uppercase leading-[0.95] tracking-tight">
          My Third Place.<br />
          Unapologetically Yours.
        </h1>
      </div>

      {/* Quick Description */}
      <div className="text-center px-6 md:px-8 pb-8 md:pb-12">
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Connect with local communities, discover exciting events, and build meaningful relationships in your neighborhood.
        </p>
      </div>

      {/* Primary CTAs - Neo-Brutal buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pb-16 md:pb-20 px-6 md:px-8">
        {user ? (
          <Button size="lg" className="bg-accent text-accent-foreground text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 w-full sm:w-auto min-w-[200px]" onClick={() => navigate('/dashboard')}>
            View Dashboard
          </Button>
        ) : (
          <Button size="lg" className="bg-primary text-primary-foreground text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 w-full sm:w-auto min-w-[200px]" onClick={() => navigate('/auth')}>
            Join the Chaos
          </Button>
        )}
        <Button variant="outline" size="lg" className="bg-secondary text-secondary-foreground text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 w-full sm:w-auto min-w-[200px]" onClick={() => navigate('/communities')}>
          Explore Spaces
        </Button>
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
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground uppercase">
            Community Moments
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-4xl mx-auto mt-4 md:mt-6 leading-relaxed">
            Capturing the spirit of connection and shared experiences in our communities
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <Masonry items={galleryImages} columns={masonryColumns} gap={16} className="w-full" />
        </div>
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