import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { TiltedCard } from './TiltedCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  city: string;
}

interface CommunityCarouselProps {
  communities: Community[];
  className?: string;
}

export const CommunityCarousel: React.FC<CommunityCarouselProps> = ({ 
  communities, 
  className = "" 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Navigation Buttons - Hidden on mobile */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollLeft}
          className="rounded-full bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollRight}
          className="rounded-full bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 md:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory px-4 md:px-0 -mx-4 md:mx-0"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {communities.map((community, index) => (
          <motion.div
            key={community.id}
            className="flex-none w-[60vw] sm:w-[50vw] md:w-80 snap-start first:ml-4 md:first:ml-0 last:mr-4 md:last:mr-0"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            <TiltedCard community={community} className="h-full" />
          </motion.div>
        ))}
      </div>

      {/* Scroll Indicator - Mobile only */}
      <div className="md:hidden flex justify-center mt-4">
        <div className="flex gap-2">
          {communities.slice(0, Math.min(communities.length, 5)).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-muted-foreground/30"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
