import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin } from "lucide-react";
import { useNavigate } from "@/lib/nextRouterAdapter";

// Rotating accent colors for neo-brutalism community cards
const ACCENT_COLORS = [
  'bg-accent',           // yellow
  'bg-primary',          // pink
  'bg-secondary',        // cyan
  'bg-[#ADFF2F]',        // lime green
];

interface TiltedCardProps {
  children?: React.ReactNode;
  className?: string;
  colorIndex?: number;
  community?: {
    id: string;
    name: string;
    description: string;
    members: number;
    city: string;
    image_url?: string;
  };
}

export const TiltedCard: React.FC<TiltedCardProps> = ({
  children,
  className = "",
  colorIndex = 0,
  community
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (community) {
      navigate(`/communities/${community.id}`);
    }
  };

  const accentColor = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];

  return (
    <motion.div
      ref={ref}
      onClick={handleCardClick}
      className={`cursor-pointer ${className}`}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className={`${accentColor} border-2 border-foreground shadow-brutal hover:shadow-brutal-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150 h-full overflow-hidden group text-black`}>
        {community ? (
          <div className="h-full flex flex-col">
            {/* Community Image */}
            {community.image_url && (
              <div className="relative h-48 overflow-hidden border-b-2 border-foreground">
                <img
                  src={community.image_url}
                  alt={community.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            <div className="p-5 flex-1 flex flex-col">
              {/* Community Name */}
              <CardTitle className="text-lg font-bold mb-2 line-clamp-2 uppercase">
                {community.name}
              </CardTitle>

              {/* Community Description */}
              <CardDescription className="text-sm text-black/60 mb-4 line-clamp-3 flex-grow">
                {community.description}
              </CardDescription>

              {/* Stats Row */}
              <div className="space-y-2 mt-auto">
                {/* Member Count */}
                <div className="flex items-center gap-2 text-sm font-bold text-black">
                  <div className="flex items-center gap-1.5 bg-background border-2 border-foreground px-2 py-0.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{community.members} members</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  <Badge variant="outline" className="bg-background text-black border-foreground">
                    {community.city}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </Card>
    </motion.div>
  );
};
