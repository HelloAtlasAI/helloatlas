// Pixel-stable sphere configuration for consistent rendering across all container sizes

export interface AtlasSphereConfig {
  // Visual style (screen-space stable) 
  pointSizePx: number;          // Base point size in CSS pixels (e.g. 2.5)
  pointSoftness: number;        // 0..1 for edge falloff
  
  // Density mode - critical for consistency across sizes
  particleMode: 'fixed' | 'density';
  particleCount: number;        // Used if mode is 'fixed'
  particlesPerMegapixel: number; // Used if mode is 'density' (e.g. 15000 = 15k particles per megapixel)
  
  // Quality controls
  maxDpr: number;               // Clamp DPR for performance (e.g. 2)
  minParticles: number;         // Minimum particle count even for tiny containers
  maxParticles: number;         // Maximum to prevent GPU overload
  
  // Bloom settings
  bloom: {
    enabled: boolean;
    strength: number;
    radius: number;
    threshold: number;
  };
}

export const defaultSphereConfig: AtlasSphereConfig = {
  pointSizePx: 2.5,
  pointSoftness: 0.65,
  
  particleMode: 'density',
  particleCount: 8000,
  particlesPerMegapixel: 45000, // ~45k particles per megapixel for good density
  
  maxDpr: 2,
  minParticles: 1500,
  maxParticles: 25000,
  
  bloom: {
    enabled: true,
    strength: 0.6,
    radius: 0.8,
    threshold: 0.2,
  },
};

// Compute dynamic particle count based on container dimensions
export function computeParticleCount(
  width: number,
  height: number,
  config: AtlasSphereConfig
): number {
  if (config.particleMode === 'fixed') {
    return config.particleCount;
  }
  
  // Calculate megapixels
  const megapixels = (width * height) / 1_000_000;
  
  // Scale particles based on area
  const rawCount = Math.round(config.particlesPerMegapixel * megapixels);
  
  // Clamp to min/max
  return Math.max(config.minParticles, Math.min(config.maxParticles, rawCount));
}

// Compute effective DPR
export function computeEffectiveDpr(config: AtlasSphereConfig): number {
  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  return Math.min(deviceDpr, config.maxDpr);
}

// Size presets for different contexts
export const CONTEXT_SIZE_PRESETS = {
  mini: { minSize: 48, maxSize: 100, cameraZ: 5.5 },
  dashboard: { minSize: 100, maxSize: 200, cameraZ: 5.0 },
  standard: { minSize: 200, maxSize: 500, cameraZ: 4.5 },
  large: { minSize: 500, maxSize: 1000, cameraZ: 4.0 },
  fullscreen: { minSize: 1000, maxSize: Infinity, cameraZ: 4.0 },
} as const;

// Get appropriate camera Z based on container size
export function computeCameraZ(containerSize: number): number {
  // Smaller containers need camera further back to show full sphere
  // Larger containers can have closer camera for detail
  if (containerSize < 100) return 5.5;
  if (containerSize < 200) return 5.0;
  if (containerSize < 400) return 4.5;
  return 4.0;
}
