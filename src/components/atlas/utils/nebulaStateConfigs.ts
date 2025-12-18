import { WakeWordState } from '@/hooks/useWakeWord';

export interface NebulaStateConfig {
  colorStart: string;
  colorMid: string;
  colorEnd: string;
  flowSpeed: number;
  flowStrength: number;
  rimIntensity: number;
  hotSpotIntensity: number;
  breathingSpeed: number;
  breathingAmount: number;
  radiusNoise: number;
  glowIntensity: number;
  // New state behavior properties
  coreRetraction: number;  // 0-0.5, how much particles pull toward center (thinking state)
  audioReactive: boolean;  // Whether breathing syncs with audio (speaking state)
}

export const NEBULA_STATE_CONFIGS: Record<WakeWordState, NebulaStateConfig> = {
  dormant: {
    colorStart: '#0a0520',
    colorMid: '#3b1d6e',
    colorEnd: '#1a3a4a',
    flowSpeed: 0.2,
    flowStrength: 0.3,
    rimIntensity: 0.6,
    hotSpotIntensity: 0.3,
    breathingSpeed: 0.3,
    breathingAmount: 0.02,
    radiusNoise: 0.1,
    glowIntensity: 0.6,
    coreRetraction: 0,
    audioReactive: false,
  },
  passive: {
    colorStart: '#1a0a3e',
    colorMid: '#6b3fa0',
    colorEnd: '#40a0a0',
    flowSpeed: 0.4,
    flowStrength: 0.4,
    rimIntensity: 0.9,
    hotSpotIntensity: 0.5,
    breathingSpeed: 0.5,
    breathingAmount: 0.04,
    radiusNoise: 0.12,
    glowIntensity: 0.8,
    coreRetraction: 0,
    audioReactive: false,
  },
  activated: {
    colorStart: '#2a1550',
    colorMid: '#a855f7',
    colorEnd: '#22d3ee',
    flowSpeed: 0.8,         // Reduced from 1.2 - less dramatic
    flowStrength: 0.6,      // Reduced from 0.8
    rimIntensity: 1.4,      // Reduced from 2.0 - less harsh
    hotSpotIntensity: 1.0,  // Reduced from 1.5
    breathingSpeed: 0.8,    // Reduced from 1.0
    breathingAmount: 0.08,  // Reduced from 0.12
    radiusNoise: 0.15,      // Reduced from 0.2
    glowIntensity: 1.3,     // Reduced from 1.5
    coreRetraction: 0,
    audioReactive: false,
  },
  listening: {
    // Optimized for calmer, less jittery animation
    colorStart: '#0a2040',
    colorMid: '#3b82f6',
    colorEnd: '#67e8f9',
    flowSpeed: 0.35,        // Reduced from 0.6 - slower, calmer flow
    flowStrength: 0.3,      // Reduced from 0.5 - less displacement
    rimIntensity: 1.0,      // Reduced from 1.4 - less harsh
    hotSpotIntensity: 0.4,  // Reduced from 0.8 - subtler hot spots
    breathingSpeed: 0.35,   // Reduced from 0.6 - calmer breathing
    breathingAmount: 0.035, // Reduced from 0.06 - gentler breathing
    radiusNoise: 0.06,      // Reduced from 0.15 - much less jitter
    glowIntensity: 1.0,
    coreRetraction: 0,
    audioReactive: false,
  },
  thinking: {
    colorStart: '#2d1b4e',
    colorMid: '#a855f7',
    colorEnd: '#e879f9',
    flowSpeed: 0.8,         // Slightly reduced for smoother look
    flowStrength: 0.6,
    rimIntensity: 1.6,
    hotSpotIntensity: 1.0,
    breathingSpeed: 0.7,
    breathingAmount: 0.06,
    radiusNoise: 0.12,
    glowIntensity: 1.2,
    coreRetraction: 0.25,   // Particles pull toward core during thinking
    audioReactive: false,
  },
  speaking: {
    colorStart: '#1a0a3e',
    colorMid: '#f59e0b',
    colorEnd: '#fcd34d',
    flowSpeed: 0.6,
    flowStrength: 0.5,
    rimIntensity: 1.4,
    hotSpotIntensity: 0.8,
    breathingSpeed: 0.6,
    breathingAmount: 0.08,
    radiusNoise: 0.12,
    glowIntensity: 1.3,
    coreRetraction: 0,
    audioReactive: true,    // Audio-reactive breathing enabled
  },
};
