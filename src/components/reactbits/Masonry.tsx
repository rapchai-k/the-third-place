import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MasonryItem {
  id: string;
  src: string;
  alt: string;
  height?: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const [itemPositions, setItemPositions] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const columnWidth = (containerWidth - gap * (columns - 1)) / columns;

    const heights = new Array(columns).fill(0);
    const positions: { x: number; y: number }[] = [];

    items.forEach((item, index) => {
      // Find the shortest column
      const shortestColumnIndex = heights.indexOf(Math.min(...heights));

      // Calculate position
      const x = shortestColumnIndex * (columnWidth + gap);
      const y = heights[shortestColumnIndex];

      positions.push({ x, y });

      // Update column height (using a default height if not provided)
      const itemHeight = item.height || 200 + Math.random() * 200;
      heights[shortestColumnIndex] += itemHeight + gap;
    });

    setColumnHeights(heights);
    setItemPositions(positions);
  }, [items, columns, gap]);

  const containerHeight = columnHeights.length > 0 ? Math.max(...columnHeights) : 0;
  const safeContainerHeight = isFinite(containerHeight) ? containerHeight : 0;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: safeContainerHeight }}
    >
      {items.map((item, index) => {
        const position = itemPositions[index];
        if (!position) return null;

        const containerWidth = containerRef.current?.offsetWidth || 0;
        const columnWidth = (containerWidth - gap * (columns - 1)) / columns;

        return (
          <motion.div
            key={item.id}
            className="absolute overflow-hidden border-2 border-foreground shadow-brutal hover:shadow-brutal-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150"
            style={{
              left: position.x,
              top: position.y,
              width: columnWidth,
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
            <img
              src={item.src}
              alt={item.alt}
              className="w-full h-auto object-cover"
              style={{
                height: item.height || 200 + Math.random() * 200,
                objectFit: 'cover'
              }}
              loading="lazy"
            />

          </motion.div>
        );
      })}
    </div>
  );
};
