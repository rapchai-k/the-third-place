import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface MasonryItem {
  id: string;
  src: string;
  alt: string;
  height?: number;
  type?: 'image' | 'video';
}

interface ImageDimensions {
  width: number;
  height: number;
  loaded: boolean;
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
  const [itemPositions, setItemPositions] = useState<{ x: number; y: number; height: number }[]>([]);
  const [imageDimensions, setImageDimensions] = useState<Map<string, ImageDimensions>>(new Map());
  const [containerWidth, setContainerWidth] = useState(0);

  // Load image dimensions
  const loadImageDimensions = useCallback((item: MasonryItem) => {
    if (imageDimensions.has(item.id)) return;

    const img = new Image();
    img.onload = () => {
      setImageDimensions(prev => {
        const newMap = new Map(prev);
        newMap.set(item.id, {
          width: img.naturalWidth,
          height: img.naturalHeight,
          loaded: true
        });
        return newMap;
      });
    };
    img.onerror = () => {
      setImageDimensions(prev => {
        const newMap = new Map(prev);
        newMap.set(item.id, { width: 400, height: 300, loaded: true });
        return newMap;
      });
    };
    img.src = item.src;
  }, [imageDimensions]);

  // Load all image dimensions on mount or when items change
  useEffect(() => {
    items.forEach(item => loadImageDimensions(item));
  }, [items, loadImageDimensions]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate positions once we have dimensions
  useEffect(() => {
    if (!containerRef.current || containerWidth === 0) return;

    const columnWidth = (containerWidth - gap * (columns - 1)) / columns;
    const heights = new Array(columns).fill(0);
    const positions: { x: number; y: number; height: number }[] = [];

    items.forEach((item) => {
      const shortestColumnIndex = heights.indexOf(Math.min(...heights));
      const x = shortestColumnIndex * (columnWidth + gap);
      const y = heights[shortestColumnIndex];

      const dims = imageDimensions.get(item.id);
      let itemHeight: number;
      if (dims && dims.loaded) {
        const aspectRatio = dims.height / dims.width;
        itemHeight = columnWidth * aspectRatio;
      } else {
        itemHeight = item.height || 250;
      }

      positions.push({ x, y, height: itemHeight });
      heights[shortestColumnIndex] += itemHeight + gap;
    });

    setColumnHeights(heights);
    setItemPositions(positions);
  }, [items, columns, gap, imageDimensions, containerWidth]);

  const maxHeight = columnHeights.length > 0 ? Math.max(...columnHeights) : 0;
  const safeContainerHeight = isFinite(maxHeight) ? maxHeight : 0;
  const columnWidth = containerWidth > 0 ? (containerWidth - gap * (columns - 1)) / columns : 0;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: safeContainerHeight }}
    >
      {items.map((item, index) => {
        const position = itemPositions[index];
        if (!position) return null;

        return (
          <motion.div
            key={item.id}
            className="absolute overflow-hidden border-2 border-foreground shadow-brutal hover:shadow-brutal-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-150"
            style={{
              left: position.x,
              top: position.y,
              width: columnWidth,
              height: position.height,
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
                className="w-full h-full object-cover block"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover block"
                loading="lazy"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
