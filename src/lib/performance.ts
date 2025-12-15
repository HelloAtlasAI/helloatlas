/**
 * Performance utilities for enterprise-grade optimization
 */

// Throttle function - limits call frequency
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, delay - timeSinceLastCall);
    }
  };
};

// Debounce function - delays execution until idle
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};

// RAF-based throttle for smooth animations
export const rafThrottle = <T extends (...args: unknown[]) => unknown>(
  fn: T
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args;
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) fn(...lastArgs);
        rafId = null;
      });
    }
  };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
};

// Memoize function results
export const memoize = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyResolver?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
};

// Batch DOM updates
export const batchUpdate = (updates: (() => void)[]): void => {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
};

// Idle callback wrapper with fallback
export const runWhenIdle = (
  callback: () => void,
  timeout = 1000
): number => {
  if ('requestIdleCallback' in window) {
    return (window as Window & { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number }).requestIdleCallback(callback, { timeout });
  }
  return setTimeout(callback, 16) as unknown as number;
};

// Cancel idle callback
export const cancelIdle = (id: number): void => {
  if ('cancelIdleCallback' in window) {
    (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

// Performance measurement utility
export const measurePerformance = async <T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
};

// Smooth lerp for animations
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Smooth step interpolation
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

// Device performance tier detection
export type PerformanceTier = 'high' | 'medium' | 'low';

export const detectPerformanceTier = (): PerformanceTier => {
  // Check for hardware concurrency
  const cores = navigator.hardwareConcurrency || 2;
  
  // Check for device memory (if available)
  const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;
  
  // Check for WebGL capabilities
  let gpuTier: 'high' | 'medium' | 'low' = 'medium';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (renderer.toLowerCase().includes('nvidia') || renderer.toLowerCase().includes('radeon')) {
          gpuTier = 'high';
        } else if (renderer.toLowerCase().includes('intel')) {
          gpuTier = 'medium';
        }
      }
    }
  } catch {
    gpuTier = 'low';
  }

  // Combined scoring
  if (cores >= 8 && memory >= 8 && gpuTier === 'high') return 'high';
  if (cores >= 4 && memory >= 4) return 'medium';
  return 'low';
};

// Get recommended particle count based on performance tier
export const getRecommendedParticleCount = (tier: PerformanceTier): number => {
  switch (tier) {
    case 'high': return 3000;
    case 'medium': return 1500;
    case 'low': return 800;
  }
};

// Frame rate monitor
export class FrameRateMonitor {
  private frames: number[] = [];
  private lastTime = performance.now();
  private readonly maxSamples = 60;

  update(): number {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.frames.push(1000 / delta);
    if (this.frames.length > this.maxSamples) {
      this.frames.shift();
    }

    return this.getAverageFPS();
  }

  getAverageFPS(): number {
    if (this.frames.length === 0) return 60;
    return this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
  }

  shouldReduceQuality(): boolean {
    return this.getAverageFPS() < 30;
  }
}
