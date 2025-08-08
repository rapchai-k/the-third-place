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

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);
  
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
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm border border-border/50 h-full">
        {community ? (
          <div className="p-4 h-full flex flex-col">
            {/* Community Name */}
            <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">
              {community.name}
            </CardTitle>

            {/* Community Description */}
            <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow">
              {community.description}
            </CardDescription>

            {/* Member Count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Users className="w-4 h-4" />
              <span>{community.members} members</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {community.city}
              </Badge>
            </div>
          </div>
        ) : (
          children
        )}
      </Card>
    </motion.div>
  );
};
