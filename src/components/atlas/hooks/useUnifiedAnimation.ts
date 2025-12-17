import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

interface AnimationCallback {
  id: string;
  priority: number; // Lower = higher priority
  callback: (time: number, delta: number) => void;
  enabled: boolean;
}

interface UnifiedAnimationState {
  callbacks: Map<string, AnimationCallback>;
  frameCount: number;
  lastTime: number;
  frameBudgetMs: number;
  averageFrameTime: number;
  shouldSkipFrame: boolean;
}

/**
 * Unified animation loop that coordinates all particle system updates
 * with frame budgeting and automatic frame skipping when lagging
 */
export function useUnifiedAnimation(frameBudgetMs: number = 16) {
  const stateRef = useRef<UnifiedAnimationState>({
    callbacks: new Map(),
    frameCount: 0,
    lastTime: 0,
    frameBudgetMs,
    averageFrameTime: 0,
    shouldSkipFrame: false,
  });

  const register = useCallback((
    id: string, 
    callback: (time: number, delta: number) => void, 
    priority: number = 50
  ) => {
    stateRef.current.callbacks.set(id, {
      id,
      priority,
      callback,
      enabled: true,
    });
    
    return () => {
      stateRef.current.callbacks.delete(id);
    };
  }, []);

  const setEnabled = useCallback((id: string, enabled: boolean) => {
    const callback = stateRef.current.callbacks.get(id);
    if (callback) {
      callback.enabled = enabled;
    }
  }, []);

  // Single useFrame that coordinates all animations
  useFrame((state, delta) => {
    const now = performance.now();
    const frameStart = now;
    const { callbacks, frameCount, averageFrameTime, frameBudgetMs } = stateRef.current;
    
    // Track frame timing for adaptive quality
    if (stateRef.current.lastTime > 0) {
      const actualFrameTime = now - stateRef.current.lastTime;
      stateRef.current.averageFrameTime = 
        averageFrameTime * 0.9 + actualFrameTime * 0.1;
    }
    stateRef.current.lastTime = now;
    stateRef.current.frameCount = frameCount + 1;

    // Skip non-critical updates if we're behind budget
    const isBehindBudget = averageFrameTime > frameBudgetMs * 1.2;
    stateRef.current.shouldSkipFrame = isBehindBudget && frameCount % 2 === 0;

    // Sort callbacks by priority and execute
    const sortedCallbacks = Array.from(callbacks.values())
      .filter(c => c.enabled)
      .sort((a, b) => a.priority - b.priority);

    const time = state.clock.elapsedTime;
    
    for (const { callback, priority } of sortedCallbacks) {
      // Skip low-priority callbacks when behind budget
      if (isBehindBudget && priority > 70) {
        continue;
      }
      
      callback(time, delta);
      
      // Check if we've exceeded budget
      const elapsed = performance.now() - frameStart;
      if (elapsed > frameBudgetMs && priority > 30) {
        break; // Stop processing lower priority callbacks
      }
    }
  });

  return {
    register,
    setEnabled,
    getAverageFrameTime: () => stateRef.current.averageFrameTime,
    getFrameCount: () => stateRef.current.frameCount,
    shouldSkipFrame: () => stateRef.current.shouldSkipFrame,
  };
}

/**
 * Hook for components to participate in unified animation
 * without creating their own useFrame
 */
export function useAnimationCallback(
  animationContext: ReturnType<typeof useUnifiedAnimation>,
  id: string,
  callback: (time: number, delta: number) => void,
  priority: number = 50,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Register on mount, unregister on unmount
  const unregisterRef = useRef<(() => void) | null>(null);
  
  if (!unregisterRef.current) {
    unregisterRef.current = animationContext.register(
      id, 
      (time, delta) => callbackRef.current(time, delta),
      priority
    );
  }

  // Cleanup on unmount
  useRef(() => {
    return () => {
      unregisterRef.current?.();
    };
  });
}
