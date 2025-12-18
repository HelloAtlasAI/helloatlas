import { useWakeWordFixed } from "./useWakeWordFixed";
import type { WakeWordState } from "@/types";

/**
 * Backward-compatible wrapper for older imports.
 * Keeps behavior identical to `useWakeWordFixed`.
 */
export const useWakeWord = useWakeWordFixed;

export type { WakeWordState };
