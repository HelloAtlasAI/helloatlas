import { useEffect, useState, RefObject } from 'react';

// Reference size for which settings are optimized
const REFERENCE_SIZE = 420;

// Enhanced size tiers with smooth transitions for responsive breakpoints
const SIZE_TIERS = {
  // Mobile portrait - very compact
  xs: { maxSize: 150, particleMultiplier: 0.25, sizeBoost: 1.5, label: 'Extra Small' },
  // Mobile landscape / small tablet widget
  sm: { maxSize: 250, particleMultiplier: 0.4, sizeBoost: 1.3, label: 'Small' },
  // Tablet / sidebar widget
  md: { maxSize: 350, particleMultiplier: 0.65, sizeBoost: 1.15, label: 'Medium' },
  // Desktop standard
  lg: { maxSize: 450, particleMultiplier: 1.0, sizeBoost: 1.0, label: 'Large' },
  // Desktop large / hero
  xl: { maxSize: 600, particleMultiplier: 1.2, sizeBoost: 0.95, label: 'Extra Large' },
  // Ultra-wide / fullscreen
  ultra: { maxSize: Infinity, particleMultiplier: 1.4, sizeBoost: 0.9, label: 'Ultra' },
};

export type ResponsiveTier = keyof typeof SIZE_TIERS;

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
  tier: ResponsiveTier;
  tierLabel: string;
  useCompactMode: boolean;
  // Additional breakpoint info
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Smooth interpolation between tiers for seamless transitions
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function getTierConfig(size: number): { 
  tier: ResponsiveTier; 
  particleMultiplier: number; 
  sizeBoost: number;
  interpolatedMultiplier: number;
  interpolatedBoost: number;
} {
  const tiers = Object.entries(SIZE_TIERS) as [ResponsiveTier, typeof SIZE_TIERS.xs][];
  
  for (let i = 0; i < tiers.length; i++) {
    const [tierName, config] = tiers[i];
    if (size <= config.maxSize) {
      // Get previous tier for interpolation
      const prevTier = i > 0 ? tiers[i - 1] : null;
      const prevMax = prevTier ? prevTier[1].maxSize : 0;
      
      // Calculate position within current tier range (0-1)
      const rangeSize = config.maxSize - prevMax;
      const positionInRange = rangeSize > 0 ? (size - prevMax) / rangeSize : 1;
      
      // Smooth interpolation between tiers
      const prevMultiplier = prevTier ? prevTier[1].particleMultiplier : config.particleMultiplier * 0.7;
      const prevBoost = prevTier ? prevTier[1].sizeBoost : config.sizeBoost * 1.2;
      
      return {
        tier: tierName,
        particleMultiplier: config.particleMultiplier,
        sizeBoost: config.sizeBoost,
        interpolatedMultiplier: lerp(prevMultiplier, config.particleMultiplier, positionInRange),
        interpolatedBoost: lerp(prevBoost, config.sizeBoost, positionInRange),
      };
    }
  }
  
  // Default to ultra
  return {
    tier: 'ultra',
    particleMultiplier: SIZE_TIERS.ultra.particleMultiplier,
    sizeBoost: SIZE_TIERS.ultra.sizeBoost,
    interpolatedMultiplier: SIZE_TIERS.ultra.particleMultiplier,
    interpolatedBoost: SIZE_TIERS.ultra.sizeBoost,
  };
}

export function useResponsiveAtlas(containerRef: RefObject<HTMLElement | null>): ResponsiveAtlasScale {
  const [scale, setScale] = useState<ResponsiveAtlasScale>({
    sizeMultiplier: 1,
    particleMultiplier: 1,
    particleSizeBoost: 1,
    containerSize: REFERENCE_SIZE,
    tier: 'lg',
    tierLabel: 'Large',
    useCompactMode: false,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const calculateScale = (width: number, height: number) => {
      const size = Math.min(width, height);
      
      // Base size multiplier relative to reference
      const sizeMultiplier = Math.max(0.2, Math.min(2.0, size / REFERENCE_SIZE));
      
      // Get tier config with smooth interpolation
      const tierConfig = getTierConfig(size);

      // Auto-enable compact mode for small containers
      const useCompactMode = tierConfig.tier === 'xs' || tierConfig.tier === 'sm';

      // Determine device category
      const isMobile = size < 250;
      const isTablet = size >= 250 && size < 450;
      const isDesktop = size >= 450;

      setScale({
        sizeMultiplier,
        // Use interpolated values for smooth transitions
        particleMultiplier: tierConfig.interpolatedMultiplier,
        particleSizeBoost: tierConfig.interpolatedBoost,
        containerSize: size,
        tier: tierConfig.tier,
        tierLabel: SIZE_TIERS[tierConfig.tier].label,
        useCompactMode,
        isMobile,
        isTablet,
        isDesktop,
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

// Export tier info for UI display
export const RESPONSIVE_TIERS = SIZE_TIERS;
