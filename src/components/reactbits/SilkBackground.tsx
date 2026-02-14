import React from 'react';

interface SilkBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Neo-Brutalism Background
 * Replaces the silk waves/particles with a flat beige background
 * and an optional subtle grid pattern for visual texture.
 */
export const SilkBackground: React.FC<SilkBackgroundProps> = ({
  children,
  className = ""
}) => {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-background ${className}`}>
      {/* Subtle grid pattern for neo-brutal texture */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
