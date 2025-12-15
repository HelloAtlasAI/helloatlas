# Legacy Universe Components

This directory contains the original "universe" visualization components that were part of the initial Atlas AI interface design.

## Status: DISABLED (Preserved)

These components are **not currently imported or used** in the main application, but are preserved for:
- Reference and learning
- Potential future use
- Demonstration of advanced Three.js/React Three Fiber techniques

## Components Overview

### Core Visualization
- `VariantVisualization.tsx` - Main 3D visualization container with multiple sphere variants
- `UnifiedVisualization.tsx` - Unified particle system visualization
- `HybridVisualization.tsx` - Hybrid rendering approach

### Sphere Variants (in `scenes/`)
- `MorphingSphereClassic.tsx` - Classic morphing sphere
- `MorphingSphereCrystal.tsx` - Crystal-style rendering
- `MorphingSphereDataFlow.tsx` - Data flow visualization
- `MorphingSphereNebula.tsx` - Nebula-style particles
- `MorphingSpherePulse.tsx` - Pulsing sphere effect
- `MorphingSphereScene.tsx` - Main scene orchestrator

### Particle Systems (in `particles/`)
- `ParticleUniverseSystem.tsx` - Universe particle system
- `DataStreamNetwork.tsx` - Data stream visualization
- `NebulaBackground.tsx` - Nebula background effect
- `ParticleTrails.tsx` - Particle trail effects
- `useParticlePool.ts` - Particle pooling hook

### UI Components
- `HolographicCard.tsx` - Floating holographic cards
- `HolographicHUD.tsx` - HUD overlay elements
- `GlassCard.tsx` - Glassmorphic card styling
- `FloatingCards.tsx` - Floating card animations
- `ChatInput.tsx` - Chat input component
- `ConversationPanel.tsx` - Conversation display
- `ControlPanel.tsx` - Settings controls
- `SettingsPanel.tsx` - Extended settings

### Effects & Backgrounds
- `ImmersiveBackground.tsx` - Immersive background effects
- `BackgroundEffects.tsx` - Additional background FX
- `DataRain.tsx` - Data rain animation
- `ParticleUniverse.tsx` - Particle universe container

### 3D Elements
- `AIOrb.tsx` - AI orb visualization
- `AIAvatar3D.tsx` - 3D AI avatar
- `CyberGrid3D.tsx` - Cyberpunk grid effect
- `DigitalFace3D.tsx` - Digital face rendering
- `NeuralCore3D.tsx` - Neural core visualization

## Why Disabled?

1. **Performance**: Multiple 3D canvases with 30k+ particles caused performance issues
2. **Complexity**: Too many visualization variants made the codebase hard to maintain
3. **Focus**: The new Dashboard with AtlasCoreFixed provides a cleaner, simpler experience

## Re-enabling

To re-enable these components:

1. Import them in your page component
2. Consider performance implications (only use one 3D canvas at a time)
3. Use the `/legacy` route to access the original Index page with these visualizations

## Technical Notes

- Uses @react-three/fiber v8.x (compatible with React 18)
- Uses @react-three/drei v9.x for helpers
- Uses @react-three/postprocessing for effects
- Custom GLSL shaders for particle systems
