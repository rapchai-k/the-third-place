import React from 'react';
import { motion } from 'framer-motion';

interface SilkBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const SilkBackground: React.FC<SilkBackgroundProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Animated silk background */}
      <div className="absolute inset-0 -z-10">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="silk-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity="0.05" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="silk-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.08" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.03" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          
          {/* First silk wave */}
          <motion.path
            d="M0,400 Q300,200 600,400 T1200,400 L1200,800 L0,800 Z"
            fill="url(#silk-gradient-1)"
            animate={{
              d: [
                "M0,400 Q300,200 600,400 T1200,400 L1200,800 L0,800 Z",
                "M0,350 Q300,250 600,350 T1200,350 L1200,800 L0,800 Z",
                "M0,400 Q300,200 600,400 T1200,400 L1200,800 L0,800 Z"
              ]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Second silk wave */}
          <motion.path
            d="M0,500 Q400,300 800,500 T1200,500 L1200,800 L0,800 Z"
            fill="url(#silk-gradient-2)"
            animate={{
              d: [
                "M0,500 Q400,300 800,500 T1200,500 L1200,800 L0,800 Z",
                "M0,450 Q400,350 800,450 T1200,450 L1200,800 L0,800 Z",
                "M0,500 Q400,300 800,500 T1200,500 L1200,800 L0,800 Z"
              ]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          
          {/* Third silk wave */}
          <motion.path
            d="M0,600 Q200,450 400,600 Q600,750 800,600 Q1000,450 1200,600 L1200,800 L0,800 Z"
            fill="url(#silk-gradient-1)"
            animate={{
              d: [
                "M0,600 Q200,450 400,600 Q600,750 800,600 Q1000,450 1200,600 L1200,800 L0,800 Z",
                "M0,550 Q200,400 400,550 Q600,700 800,550 Q1000,400 1200,550 L1200,800 L0,800 Z",
                "M0,600 Q200,450 400,600 Q600,750 800,600 Q1000,450 1200,600 L1200,800 L0,800 Z"
              ]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
        </svg>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
