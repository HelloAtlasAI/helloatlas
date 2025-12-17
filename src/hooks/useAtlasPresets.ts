import { useState, useCallback, useEffect } from 'react';
import { AtlasSettings } from './useAtlasSettings';

const PRESETS_STORAGE_KEY = 'atlas-custom-presets';

export interface AtlasPreset {
  id: string;
  name: string;
  description?: string;
  settings: Partial<AtlasSettings>;
  createdAt: number;
  icon?: string;
}

// Built-in presets that cannot be deleted
export const builtInPresets: AtlasPreset[] = [
  {
    id: 'cosmic-drift',
    name: 'Cosmic Drift',
    description: 'Slow, ethereal nebula movement',
    icon: '🌀',
    createdAt: 0,
    settings: {
      visualizationMode: 'nebulaFlow',
      nebulaParticleCount: 21000,  // Scaled for 420px
      nebulaFlowSpeed: 0.3,
      nebulaFlowStrength: 0.4,
      nebulaBreathingSpeed: 0.3,
      nebulaBreathingAmount: 0.03,
      nebulaGlowIntensity: 0.9,
    },
  },
  {
    id: 'electric-storm',
    name: 'Electric Storm',
    description: 'High energy, intense visuals',
    icon: '⚡',
    createdAt: 0,
    settings: {
      visualizationMode: 'nebulaFlow',
      nebulaParticleCount: 12500,  // Scaled for 420px
      nebulaFlowSpeed: 1.5,
      nebulaFlowStrength: 0.9,
      nebulaRimIntensity: 2.5,
      nebulaHotSpotIntensity: 1.5,
      nebulaGlowIntensity: 1.5,
    },
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    description: 'Dark, minimal ambient glow',
    icon: '🌑',
    createdAt: 0,
    settings: {
      visualizationMode: 'nebulaFlow',
      nebulaParticleCount: 6700,  // Scaled for 420px
      nebulaFlowSpeed: 0.2,
      nebulaFlowStrength: 0.2,
      nebulaRimIntensity: 0.5,
      nebulaGlowIntensity: 0.6,
      nebulaColorStart: '#050510',
      nebulaColorMid: '#1a1a3e',
      nebulaColorEnd: '#2a4a5a',
    },
  },
  {
    id: 'solid-surface',
    name: 'Solid Surface',
    description: 'Seamless spherical surface',
    icon: '🔮',
    createdAt: 0,
    settings: {
      visualizationMode: 'nebulaFlow',
      nebulaSolidSurface: true,
      nebulaParticleCount: 29000,  // Scaled for 420px
      nebulaParticleSize: 0.075,   // Slightly larger
      nebulaSurfaceBlend: 1.8,
      nebulaUniformSize: 1.6,
      nebulaCoherence: 0.95,
      nebulaRadiusNoise: 0.08,
      nebulaBreathingAmount: 0.04,
      nebulaGlowIntensity: 0.9,
    },
  },
  {
    id: 'ultra-hd',
    name: 'Ultra HD',
    description: 'Maximum particle density',
    icon: '✨',
    createdAt: 0,
    settings: {
      visualizationMode: 'nebulaFlow',
      nebulaParticleCount: 42000,  // Scaled for 420px
      nebulaParticleSize: 0.045,   // Slightly larger
      nebulaGlowIntensity: 1.3,
      nebulaCoreGlow: 1.5,
      nebulaDepthFade: 0.2,
    },
  },
  {
    id: 'classic-fire',
    name: 'Classic Fire',
    description: 'Original particle system',
    icon: '🔥',
    createdAt: 0,
    settings: {
      visualizationMode: 'classic',
      particleCount: 1650,  // Scaled for 420px
      enableBloom: true,
      bloomIntensity: 0.8,
      enableCore: true,
      coreIntensity: 1.2,
    },
  },
];

function loadCustomPresets(): AtlasPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load custom presets:', e);
  }
  return [];
}

function saveCustomPresets(presets: AtlasPreset[]) {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save custom presets:', e);
  }
}

export interface UseAtlasPresetsReturn {
  allPresets: AtlasPreset[];
  customPresets: AtlasPreset[];
  savePreset: (name: string, settings: Partial<AtlasSettings>, description?: string, icon?: string) => AtlasPreset;
  deletePreset: (id: string) => boolean;
  renamePreset: (id: string, newName: string) => boolean;
  isBuiltIn: (id: string) => boolean;
}

export function useAtlasPresets(): UseAtlasPresetsReturn {
  const [customPresets, setCustomPresets] = useState<AtlasPreset[]>(() => loadCustomPresets());

  // Auto-save when custom presets change
  useEffect(() => {
    saveCustomPresets(customPresets);
  }, [customPresets]);

  const savePreset = useCallback((
    name: string,
    settings: Partial<AtlasSettings>,
    description?: string,
    icon?: string
  ): AtlasPreset => {
    const newPreset: AtlasPreset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      icon: icon || '💾',
      settings,
      createdAt: Date.now(),
    };
    setCustomPresets(prev => [...prev, newPreset]);
    return newPreset;
  }, []);

  const deletePreset = useCallback((id: string): boolean => {
    // Cannot delete built-in presets
    if (builtInPresets.some(p => p.id === id)) {
      return false;
    }
    setCustomPresets(prev => prev.filter(p => p.id !== id));
    return true;
  }, []);

  const renamePreset = useCallback((id: string, newName: string): boolean => {
    if (builtInPresets.some(p => p.id === id)) {
      return false;
    }
    setCustomPresets(prev => prev.map(p => 
      p.id === id ? { ...p, name: newName } : p
    ));
    return true;
  }, []);

  const isBuiltIn = useCallback((id: string): boolean => {
    return builtInPresets.some(p => p.id === id);
  }, []);

  const allPresets = [...builtInPresets, ...customPresets];

  return {
    allPresets,
    customPresets,
    savePreset,
    deletePreset,
    renamePreset,
    isBuiltIn,
  };
}
