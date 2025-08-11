import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TiltedCardProps {
  children?: React.ReactNode;
  className?: string;
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
  community
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["0deg", "0deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["0deg", "0deg"]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleCardClick = () => {
    if (community) {
      navigate(`/communities/${community.id}`);
    }
  };
  
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      style={{
        rotateY: rotateY,
        rotateX: rotateX,
        transformStyle: "preserve-3d",
      }}
      className={`perspective-1000 cursor-pointer ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="hover:shadow-xl transition-all duration-300 bg-card/90 backdrop-blur-md border border-border/50 h-full overflow-hidden group">
        {community ? (
          <div className="h-full flex flex-col">
            {/* Community Image */}
            {community.image_url && (
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={community.image_url} 
                  alt={community.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              </div>
            )}
            
            <div className="p-6 flex-1 flex flex-col">
              {/* Community Name */}
              <CardTitle className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-smooth">
                {community.name}
              </CardTitle>

              {/* Community Description */}
              <CardDescription className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-grow">
                {community.description}
              </CardDescription>

              {/* Stats Row */}
              <div className="space-y-3 mt-auto">
                {/* Member Count */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium">{community.members} members</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <Badge variant="secondary" className="text-xs bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-smooth">
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
