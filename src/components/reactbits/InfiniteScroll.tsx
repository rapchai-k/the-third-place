import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  className?: string;
  threshold?: number;
  loader?: React.ReactNode;
}

export function InfiniteScroll<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  loading,
  className = "",
  threshold = 0.1,
  loader
}: InfiniteScrollProps<T>) {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore]);

  const defaultLoader = (
    <div className="flex justify-center items-center py-8">
      <motion.div
        className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );

  return (
    <div className={className}>
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </div>
      
      {hasMore && (
        <div ref={ref} className="mt-8">
          {loading && (loader || defaultLoader)}
        </div>
      )}
      
      {!hasMore && items.length > 0 && (
        <motion.div 
          className="text-center py-8 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p>You've reached the end!</p>
        </motion.div>
      )}
    </div>
  );
}
