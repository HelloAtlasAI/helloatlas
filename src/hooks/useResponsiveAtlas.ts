import { useEffect, useState, RefObject } from 'react';

// Reference size for which settings are optimized
const REFERENCE_SIZE = 420;

// Size tiers for performance optimization
const SIZE_TIERS = {
  low: { maxSize: 250, particleMultiplier: 0.4, sizeBoost: 1.3 },
  medium: { maxSize: 350, particleMultiplier: 0.65, sizeBoost: 1.15 },
  high: { maxSize: 450, particleMultiplier: 1.0, sizeBoost: 1.0 },
  ultra: { maxSize: Infinity, particleMultiplier: 1.2, sizeBoost: 1.0 },
};

// Compact mode settings optimized for small containers (< 250px)
export const COMPACT_MODE_OVERRIDES = {
  nebulaParticleCount: 3500,
  nebulaParticleSize: 0.08,
  nebulaGlowIntensity: 1.8,
  nebulaCoreGlow: 2.0,
  nebulaDepthFade: 0.15,
  nebulaFlowSpeed: 0.25,
  nebulaFlowStrength: 0.3,
  nebulaBreathingSpeed: 0.4,
  nebulaBreathingAmount: 0.15,
  nebulaSolidSurface: true,
  nebulaSurfaceBlend: 1.5,
  nebulaUniformSize: 1.4,
  nebulaCoherence: 0.9,
  nebulaRimIntensity: 1.2,
  enableBloom: true,
  bloomIntensity: 1.0,
} as const;

export interface ResponsiveAtlasScale {
  sizeMultiplier: number;
  particleMultiplier: number;
  particleSizeBoost: number;
  containerSize: number;
  tier: 'low' | 'medium' | 'high' | 'ultra';
  useCompactMode: boolean;
}

export function useResponsiveAtlas(containerRef: RefObject<HTMLElement | null>): ResponsiveAtlasScale {
  const [scale, setScale] = useState<ResponsiveAtlasScale>({
    sizeMultiplier: 1,
    particleMultiplier: 1,
    particleSizeBoost: 1,
    containerSize: REFERENCE_SIZE,
    tier: 'high',
    useCompactMode: false,
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

      // Auto-enable compact mode for small containers
      const useCompactMode = tier === 'low';

      setScale({
        sizeMultiplier,
        particleMultiplier: tierConfig.particleMultiplier,
        particleSizeBoost: tierConfig.sizeBoost,
        containerSize: size,
        tier,
        useCompactMode,
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
