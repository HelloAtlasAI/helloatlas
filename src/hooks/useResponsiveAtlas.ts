import { useEffect, useState, useRef, RefObject } from 'react';

// Reference size for which settings are optimized
const REFERENCE_SIZE = 420;

// Size tiers for performance optimization
const SIZE_TIERS = {
  low: { maxSize: 250, particleMultiplier: 0.4, sizeBoost: 1.3 },
  medium: { maxSize: 350, particleMultiplier: 0.65, sizeBoost: 1.15 },
  high: { maxSize: 450, particleMultiplier: 1.0, sizeBoost: 1.0 },
  ultra: { maxSize: Infinity, particleMultiplier: 1.2, sizeBoost: 1.0 },
};

export interface ResponsiveAtlasScale {
  sizeMultiplier: number;
  particleMultiplier: number;
  particleSizeBoost: number;
  containerSize: number;
  tier: 'low' | 'medium' | 'high' | 'ultra';
}

export function useResponsiveAtlas(containerRef: RefObject<HTMLElement | null>): ResponsiveAtlasScale {
  const [scale, setScale] = useState<ResponsiveAtlasScale>({
    sizeMultiplier: 1,
    particleMultiplier: 1,
    particleSizeBoost: 1,
    containerSize: REFERENCE_SIZE,
    tier: 'high',
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const calculateScale = (width: number, height: number) => {
      const size = Math.min(width, height);
      
      // Base size multiplier relative to reference
      const sizeMultiplier = Math.max(0.3, Math.min(1.5, size / REFERENCE_SIZE));
      
      // Determine performance tier
      let tier: 'low' | 'medium' | 'high' | 'ultra' = 'high';
      let tierConfig = SIZE_TIERS.high;
      
      if (size <= SIZE_TIERS.low.maxSize) {
        tier = 'low';
        tierConfig = SIZE_TIERS.low;
      } else if (size <= SIZE_TIERS.medium.maxSize) {
        tier = 'medium';
        tierConfig = SIZE_TIERS.medium;
      } else if (size <= SIZE_TIERS.high.maxSize) {
        tier = 'high';
        tierConfig = SIZE_TIERS.high;
      } else {
        tier = 'ultra';
        tierConfig = SIZE_TIERS.ultra;
      }

      setScale({
        sizeMultiplier,
        particleMultiplier: tierConfig.particleMultiplier,
        particleSizeBoost: tierConfig.sizeBoost,
        containerSize: size,
        tier,
      });
    };

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      calculateScale(width, height);
    });

    observer.observe(containerRef.current);

    // Initial calculation
    const rect = containerRef.current.getBoundingClientRect();
    calculateScale(rect.width, rect.height);

    return () => observer.disconnect();
  }, [containerRef]);

  return scale;
}
