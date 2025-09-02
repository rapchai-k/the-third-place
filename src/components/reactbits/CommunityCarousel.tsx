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
    <div className={`relative ${className} mobile-safe`}>
      {/* Navigation Buttons - Hidden on mobile */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-12 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollLeft}
          className="rounded-full bg-background/90 backdrop-blur-md border-border/50 hover:bg-background hover:shadow-glow transition-bounce"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-12 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollRight}
          className="rounded-full bg-background/90 backdrop-blur-md border-border/50 hover:bg-background hover:shadow-glow transition-bounce"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory px-6 md:px-8 -mx-6 md:-mx-8"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {communities.map((community, index) => (
          <motion.div
            key={community.id}
            className="flex-none w-[280px] sm:w-[320px] md:w-[360px] snap-start"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.6,
              delay: index * 0.1,
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
          >
            <TiltedCard community={community} className="h-full shadow-glow hover:shadow-primary transition-bounce" />
          </motion.div>
        ))}
      </div>

      {/* Scroll Indicator - Mobile only */}
      <div className="md:hidden flex justify-center mt-6">
        <div className="flex gap-2">
          {communities.slice(0, Math.min(communities.length, 5)).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-primary/30 transition-smooth hover:bg-primary"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
