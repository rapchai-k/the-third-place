import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SpotlightCardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ 
  children, 
  className = "", 
  title,
  description,
  icon
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(129, 140, 248, 0.15), transparent 40%)`,
        }}
      />
      <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-md border border-border/50 hover:shadow-glow transition-all duration-500 hover:scale-105 h-full">
        <CardContent className="p-8">
          <div className="relative z-10">
            {/* Icon with gradient background */}
            {icon && (
              <div className="mb-6 inline-flex">
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 group-hover:scale-110">
                  {icon}
                </div>
              </div>
            )}

            {/* Title */}
            {title && (
              <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-smooth">
                {title}
              </h3>
            )}

            {/* Description */}
            {description && (
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}

            {/* Custom children content */}
            {children}
          </div>

          {/* Spotlight effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Subtle animated border */}
          <div className="absolute inset-0 rounded-lg border border-primary/0 group-hover:border-primary/30 transition-all duration-500" />
        </CardContent>
      </Card>
    </motion.div>
  );
};
