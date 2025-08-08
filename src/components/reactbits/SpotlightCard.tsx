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
      <Card className="relative h-full bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-colors duration-300">
        {title || description || icon ? (
          <>
            <CardHeader className="text-center">
              {icon && (
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {icon}
                  </div>
                </div>
              )}
              {title && <CardTitle className="text-xl">{title}</CardTitle>}
              {description && <CardDescription className="text-base">{description}</CardDescription>}
            </CardHeader>
            {children && <CardContent>{children}</CardContent>}
          </>
        ) : (
          children
        )}
      </Card>
    </motion.div>
  );
};
