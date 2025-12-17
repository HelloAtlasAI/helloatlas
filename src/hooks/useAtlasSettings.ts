import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { WakeWordState } from '@/hooks/useWakeWordFixed';

const STORAGE_KEY = 'atlas-demo-settings';
const SETTINGS_VERSION = 7; // Bump this to force reset of corrupted settings

// Complete settings interface for Atlas visualization
export interface AtlasSettings {
  // Visualization mode
  visualizationMode: 'classic' | 'nebulaFlow';
  
  // Dashboard preview mode
  dashboardPreview: boolean;
  
  // Core state
  state: WakeWordState;
  morphProgress: number;
  audioLevel: number;
  autoAudio: boolean;
  
  // Trail settings
  enableTrails: boolean;
  trailLength: number;
  trailOpacity: number;
  trailColorGradient: boolean;
  trailStartColor: string;
  trailEndColor: string;
  
  // Particle settings
  particleCount: number;
  particleSize: number;
  density: number;
  rotationSpeed: number;
  
  // Effects
  enableBloom: boolean;
  bloomIntensity: number;
  morphSpeed: number;
  
  // Ripple settings
  enableRipples: boolean;
  rippleSpeed: number;
  rippleCount: number;
  
  // Turbulence settings
  enableTurbulence: boolean;
  turbulenceFrequency: number;
  turbulenceAmplitude: number;
  turbulenceSpeed: number;
  
  // Mouse interaction
  enableMouseInteraction: boolean;
  mouseMode: 'attract' | 'repulse';
  mouseStrength: number;
  mouseInfluenceRadius: number;
  
  // Core system
  enableCore: boolean;
  coreParticleCount: number;
  coreDensity: number;
  coreParticleSize: number;
  coreIntensity: number;
  corePulseSpeed: number;
  coreRotationOffset: number;
  
  // Fluid dynamics
  fluidCohesion: number;
  surfaceTension: number;
  fluidFlow: number;
  
  // Audio reactivity
  audioReactivitySpeed: number;
  
  // Nebula Flow settings
  nebulaFlowStrength: number;
  nebulaFlowSpeed: number;
  nebulaBandCount: number;
  nebulaRimIntensity: number;
  nebulaHotSpotIntensity: number;
  nebulaBreathingSpeed: number;
  nebulaBreathingAmount: number;
  nebulaRadiusNoise: number;
  nebulaColorStart: string;
  nebulaColorMid: string;
  nebulaColorEnd: string;
  
  // Enhanced Nebula settings
  nebulaParticleCount: number;
  nebulaParticleSize: number;
  nebulaDensity: number;
  nebulaRotationSpeed: number;
  nebulaStateReactive: boolean;
  nebulaGlowIntensity: number;
  nebulaDepthFade: number;
  nebulaCoreGlow: number;
  
  // Solid Surface settings
  nebulaSolidSurface: boolean;
  nebulaSurfaceBlend: number;
  nebulaUniformSize: number;
  nebulaCoherence: number;
  
  // State behavior settings
  nebulaThinkingRetraction: number;       // 0-0.5, how much particles pull toward center in thinking state
  nebulaAudioBreathingIntensity: number;  // 0-0.4, audio breathing strength in speaking state
  nebulaTransitionSpeed: number;          // 0.5-3.0, how fast states blend together
}

// Default settings - optimized for performance
export const defaultAtlasSettings: AtlasSettings = {
  visualizationMode: 'classic',
  dashboardPreview: false,
  state: 'dormant',
  // Default to a formed sphere so the demo never looks "broken" on load/reset
  morphProgress: 1.0,
  audioLevel: 0,
  autoAudio: false,
  enableTrails: false,
  trailLength: 3,
  trailOpacity: 0.4,
  trailColorGradient: true,
  trailStartColor: '#ff9500',
  trailEndColor: '#1a0a2e',
  particleCount: 1250,    // Scaled for 420px (was 1500 for 460px)
  particleSize: 0.085,    // Slightly larger to compensate
  density: 1.0,
  rotationSpeed: 0.5,
  enableBloom: true,
  bloomIntensity: 0.6,
  morphSpeed: 1.5,
  enableRipples: true,
  rippleSpeed: 1.5,
  rippleCount: 2,
  enableTurbulence: true,
  turbulenceFrequency: 0.5,
  turbulenceAmplitude: 0.06,
  turbulenceSpeed: 0.3,
  enableMouseInteraction: true,
  mouseMode: 'attract',
  mouseStrength: 0.4,
  mouseInfluenceRadius: 1.85,  // Scaled for 420px
  enableCore: true,
  coreParticleCount: 100,      // Scaled for 420px (was 120)
  coreDensity: 0.25,
  coreParticleSize: 0.045,     // Slightly larger
  coreIntensity: 1.0,
  corePulseSpeed: 1.5,
  coreRotationOffset: -0.5,
  fluidCohesion: 0,
  surfaceTension: 0.5,
  fluidFlow: 0.3,
  audioReactivitySpeed: 1.0,
  // Nebula Flow defaults
  nebulaFlowStrength: 0.5,
  nebulaFlowSpeed: 0.5,
  nebulaBandCount: 8,
  nebulaRimIntensity: 1.2,
  nebulaHotSpotIntensity: 0.8,
  nebulaBreathingSpeed: 0.5,
  nebulaBreathingAmount: 0.05,
  nebulaRadiusNoise: 0.15,
  nebulaColorStart: '#1a0a3e',
  nebulaColorMid: '#8b5cf6',
  nebulaColorEnd: '#67e8f9',
  // Enhanced Nebula defaults
  nebulaParticleCount: 6700,   // Scaled for 420px (was 8000 for 460px)
  nebulaParticleSize: 0.055,   // Slightly larger to compensate
  nebulaDensity: 1.0,
  nebulaRotationSpeed: 0.2,
  nebulaStateReactive: true,
  nebulaGlowIntensity: 1.0,
  nebulaDepthFade: 0.3,
  nebulaCoreGlow: 1.0,
  // Solid Surface defaults
  nebulaSolidSurface: false,
  nebulaSurfaceBlend: 1.5,
  nebulaUniformSize: 1.8,
  nebulaCoherence: 0.9,
  // State behavior defaults
  nebulaThinkingRetraction: 0.25,
  nebulaAudioBreathingIntensity: 0.15,
  nebulaTransitionSpeed: 1.5,
};

// Action types
type SettingsAction =
  | { type: 'SET_SETTING'; key: keyof AtlasSettings; value: AtlasSettings[keyof AtlasSettings] }
  | { type: 'SET_MULTIPLE'; settings: Partial<AtlasSettings> }
  | { type: 'RESET' }
  | { type: 'LOAD'; settings: AtlasSettings };

// Reducer
function settingsReducer(state: AtlasSettings, action: SettingsAction): AtlasSettings {
  switch (action.type) {
    case 'SET_SETTING':
      return { ...state, [action.key]: action.value };
    case 'SET_MULTIPLE':
      return { ...state, ...action.settings };
    case 'RESET':
      return { ...defaultAtlasSettings };
    case 'LOAD':
      return { ...action.settings };
    default:
      return state;
  }
}

// Load settings from localStorage
function loadSettings(): AtlasSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Force reset if version is old or missing (clears corrupted settings)
      if (!parsed._version || parsed._version < SETTINGS_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return defaultAtlasSettings;
      }
      
      const merged: AtlasSettings = { ...defaultAtlasSettings, ...parsed };

      // Ensure morphProgress is never too low (minimum 0.3 for visible sphere)
      if (typeof merged.morphProgress !== 'number' || merged.morphProgress < 0.3) {
        merged.morphProgress = 1.0;
      }

      return merged;
    }
  } catch (e) {
    console.warn('Failed to load Atlas settings:', e);
  }
  return defaultAtlasSettings;
}

// Save settings to localStorage with version
function saveSettings(settings: AtlasSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...settings,
      _version: SETTINGS_VERSION
    }));
  } catch (e) {
    console.error('Failed to save Atlas settings:', e);
  }
}

export interface UseAtlasSettingsReturn {
  settings: AtlasSettings;
  setSetting: <K extends keyof AtlasSettings>(key: K, value: AtlasSettings[K]) => void;
  setMultiple: (settings: Partial<AtlasSettings>) => void;
  reset: () => void;
  exportSettings: () => void;
  importSettings: () => void;
}

export function useAtlasSettings(): UseAtlasSettingsReturn {
  const [settings, dispatch] = useReducer(settingsReducer, defaultAtlasSettings, loadSettings);

  // Auto-save to localStorage when settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setSetting = useCallback(<K extends keyof AtlasSettings>(key: K, value: AtlasSettings[K]) => {
    dispatch({ type: 'SET_SETTING', key, value });
  }, []);

  const setMultiple = useCallback((newSettings: Partial<AtlasSettings>) => {
    dispatch({ type: 'SET_MULTIPLE', settings: newSettings });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  const importSettings = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          dispatch({ type: 'LOAD', settings: { ...defaultAtlasSettings, ...imported } });
        } catch {
          console.error('Invalid settings file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return useMemo(() => ({
    settings,
    setSetting,
    setMultiple,
    reset,
    exportSettings,
    importSettings,
  }), [settings, setSetting, setMultiple, reset, exportSettings, importSettings]);
}

// Read-only hook for components that just need to display the sphere
export function useAtlasSettingsReadOnly(): AtlasSettings {
  return useMemo(() => loadSettings(), []);
}
