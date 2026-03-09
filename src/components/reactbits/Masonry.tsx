import React from 'react';
import { motion } from 'framer-motion';

interface MasonryItem {
  id: string;
  src: string;
  alt: string;
  height?: number;
  type?: 'image' | 'video';
}

interface MasonryProps {
  items: MasonryItem[];
  columns?: number;
  gap?: number;
  className?: string;
}

export const Masonry: React.FC<MasonryProps> = ({
  items,
  columns = 3,
  gap = 16,
  className = ""
}) => {
  return (
    <div
      className={className}
      style={{
        columnCount: columns,
        columnGap: gap,
      }}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          className="overflow-hidden border-2 border-foreground shadow-brutal hover:shadow-brutal-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150"
          style={{
            breakInside: 'avoid',
            marginBottom: gap,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          whileHover={{ zIndex: 10 }}
        >
          {item.type === 'video' ? (
            <video
              src={item.src}
              className="w-full h-auto block"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={item.src}
              alt={item.alt}
              className="w-full h-auto block"
              loading="lazy"
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};
