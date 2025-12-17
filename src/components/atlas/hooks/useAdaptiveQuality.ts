import { useState, useEffect, useRef, useCallback } from 'react';
import { detectPerformanceTier, PerformanceTier } from '@/lib/performance';

export interface QualitySettings {
  particleCount: number;
  enableTrails: boolean;
  trailLength: number;
  enableBloom: boolean;
  bloomIntensity: number;
  enableCore: boolean;
  coreParticleCount: number;
  targetFPS: number;
  tier: PerformanceTier;
}

interface QualityPreset {
  particleCount: number;
  enableTrails: boolean;
  trailLength: number;
  enableBloom: boolean;
  bloomIntensity: number;
  enableCore: boolean;
  coreParticleCount: number;
}

const QUALITY_PRESETS: Record<PerformanceTier, QualityPreset> = {
  high: {
    particleCount: 8000,
    enableTrails: true,
    trailLength: 4,
    enableBloom: true,
    bloomIntensity: 0.8,
    enableCore: true,
    coreParticleCount: 500,
  },
  medium: {
    particleCount: 5000,
    enableTrails: true,
    trailLength: 2,
    enableBloom: true,
    bloomIntensity: 0.6,
    enableCore: true,
    coreParticleCount: 300,
  },
  low: {
    particleCount: 2500,
    enableTrails: false,
    trailLength: 0,
    enableBloom: false,
    bloomIntensity: 0,
    enableCore: true,
    coreParticleCount: 150,
  },
};

const FPS_SAMPLES = 30;
const REDUCE_QUALITY_THRESHOLD = 40;
const RESTORE_QUALITY_THRESHOLD = 55;

/**
 * Adaptive quality system that monitors FPS and automatically
 * adjusts quality settings to maintain smooth performance
 */
export function useAdaptiveQuality(
  enabled: boolean = true,
  initialTier?: PerformanceTier
): {
  quality: QualitySettings;
  currentFPS: number;
  tier: PerformanceTier;
  forceQuality: (tier: PerformanceTier) => void;
  resetToAuto: () => void;
} {
  const [tier, setTier] = useState<PerformanceTier>(
    initialTier ?? detectPerformanceTier()
  );
  const [quality, setQuality] = useState<QualitySettings>(() => ({
    ...QUALITY_PRESETS[tier],
    targetFPS: 60,
    tier,
  }));
  const [currentFPS, setCurrentFPS] = useState(60);
  
  const fpsSamplesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(performance.now());
  const isManualRef = useRef(false);
  const degradationLevelRef = useRef(0); // 0 = full quality, 3 = max degradation

  // FPS monitoring
  useEffect(() => {
    if (!enabled) return;

    let animationId: number;
    
    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;
      
      const fps = 1000 / delta;
      
      fpsSamplesRef.current.push(fps);
      if (fpsSamplesRef.current.length > FPS_SAMPLES) {
        fpsSamplesRef.current.shift();
      }
      
      // Calculate average FPS
      const avgFPS = fpsSamplesRef.current.reduce((a, b) => a + b, 0) / 
        fpsSamplesRef.current.length;
      
      setCurrentFPS(Math.round(avgFPS));
      
      // Auto-adjust quality if not manual
      if (!isManualRef.current && fpsSamplesRef.current.length >= FPS_SAMPLES) {
        if (avgFPS < REDUCE_QUALITY_THRESHOLD && degradationLevelRef.current < 3) {
          // Reduce quality
          degradationLevelRef.current++;
          applyDegradation(degradationLevelRef.current);
        } else if (avgFPS > RESTORE_QUALITY_THRESHOLD && degradationLevelRef.current > 0) {
          // Restore quality gradually
          degradationLevelRef.current--;
          applyDegradation(degradationLevelRef.current);
        }
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [enabled]);

  const applyDegradation = useCallback((level: number) => {
    const basePreset = QUALITY_PRESETS[tier];
    
    // Progressive degradation
    const degradations: Partial<QualityPreset>[] = [
      {}, // Level 0: Full quality
      { 
        trailLength: Math.max(0, basePreset.trailLength - 2),
        bloomIntensity: basePreset.bloomIntensity * 0.5,
      }, // Level 1: Reduce trails and bloom
      { 
        enableTrails: false,
        trailLength: 0,
        enableBloom: false,
        coreParticleCount: Math.floor(basePreset.coreParticleCount * 0.5),
      }, // Level 2: Disable trails and bloom
      { 
        enableTrails: false,
        trailLength: 0,
        enableBloom: false,
        enableCore: false,
        particleCount: Math.floor(basePreset.particleCount * 0.6),
      }, // Level 3: Maximum degradation
    ];
    
    const degradation = degradations[Math.min(level, 3)];
    
    setQuality(prev => ({
      ...prev,
      ...basePreset,
      ...degradation,
    }));
  }, [tier]);

  const forceQuality = useCallback((newTier: PerformanceTier) => {
    isManualRef.current = true;
    degradationLevelRef.current = 0;
    setTier(newTier);
    setQuality({
      ...QUALITY_PRESETS[newTier],
      targetFPS: 60,
      tier: newTier,
    });
  }, []);

  const resetToAuto = useCallback(() => {
    isManualRef.current = false;
    degradationLevelRef.current = 0;
    const detectedTier = detectPerformanceTier();
    setTier(detectedTier);
    setQuality({
      ...QUALITY_PRESETS[detectedTier],
      targetFPS: 60,
      tier: detectedTier,
    });
  }, []);

  return {
    quality,
    currentFPS,
    tier,
    forceQuality,
    resetToAuto,
  };
}
