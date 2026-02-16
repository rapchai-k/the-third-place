import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { TiltedCard } from './TiltedCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Community {
  id: string;
  slug?: string | null;
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
      {/* Navigation Buttons */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-12 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollLeft}
          className="bg-background"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-12 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollRight}
          className="bg-background"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory px-6 md:px-8 -mx-6 md:-mx-8"
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
              duration: 0.4,
              delay: index * 0.08,
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
          >
            <TiltedCard community={community} colorIndex={index} className="h-full" />
          </motion.div>
        ))}
      </div>

      {/* Scroll Indicator - Mobile only */}
      <div className="md:hidden flex justify-center mt-4">
        <div className="flex gap-2">
          {communities.slice(0, Math.min(communities.length, 5)).map((_, index) => (
            <div
              key={index}
              className="w-2.5 h-2.5 border-2 border-foreground bg-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
