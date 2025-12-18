// Pixel-stable shader utilities
// These ensure consistent visual appearance across all container sizes

export const pixelStableUniforms = `
uniform float uPixelRatio;
uniform vec2 uResolution;
uniform float uPointSizePx;
`;

// Calculate point size in a resolution-independent way
// This produces consistent visual size regardless of container dimensions
export const pixelStablePointSize = `
// Calculate screen-space point size
// uPointSizePx: desired size in CSS pixels
// uPixelRatio: device pixel ratio
// mvPosition.z: depth in view space
float calculatePointSize(float baseSizePx, float depth, float pixelRatio) {
  // Scale by pixel ratio for crisp rendering on high-DPI displays
  float scaledSize = baseSizePx * pixelRatio;
  
  // Perspective correction - objects further away appear smaller
  // Using a reference FOV factor for consistent appearance
  float perspectiveFactor = 300.0 / max(abs(depth), 0.1);
  
  return scaledSize * perspectiveFactor;
}
`;

// Updated nebula vertex shader section for pixel-stable sizing
export const nebulaPixelStableVertex = `
// Pixel-stable point size calculation
float baseSizePx = uPointSizePx * (1.0 + uAudioLevel * 0.6);

// Depth-based adjustment for volumetric feel
float depthFactor = smoothstep(2.0, 8.0, -mvPosition.z);
baseSizePx *= (1.0 + depthFactor * 0.3);

// Solid surface boost
float solidSizeBoost = uSolidSurface * uUniformSize;
baseSizePx *= (1.0 + solidSizeBoost);

// Apply pixel-stable sizing
gl_PointSize = calculatePointSize(baseSizePx, mvPosition.z, uPixelRatio);
`;
