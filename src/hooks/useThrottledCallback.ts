import { useRef, useEffect, useCallback } from 'react';

/**
 * Returns a throttled version of the callback
 * The callback will be called at most once per specified interval
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          timeoutRef.current = null;
          callbackRef.current(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [delay]
  );
}

/**
 * RAF-based throttle hook for smooth 60fps animations
 */
export function useRAFThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T & { cancel: () => void } {
  const rafRef = useRef<number | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const throttledCallback = useCallback(
    ((...args: Parameters<T>) => {
      lastArgsRef.current = args;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          if (lastArgsRef.current) {
            callbackRef.current(...lastArgsRef.current);
          }
          rafRef.current = null;
        });
      }
    }) as T & { cancel: () => void },
    []
  );

  throttledCallback.cancel = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  return throttledCallback;
}
