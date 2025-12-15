import { useRef, useCallback, useLayoutEffect } from 'react';

/**
 * Returns a stable callback reference that always calls the latest version of the callback
 * This prevents unnecessary re-renders when passing callbacks to child components
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

/**
 * Returns a stable ref that always has the latest value
 * Useful for accessing latest state in callbacks without adding to dependencies
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
