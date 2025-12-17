import * as THREE from 'three';

// Cache for generated textures
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Generate circular particle texture with radial gradient
 * Cached to prevent recreation
 */
export function generateCircleTexture(): THREE.CanvasTexture {
  const cacheKey = 'circle-64';
  
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Dispose all cached textures
 */
export function disposeTextures(): void {
  textureCache.forEach(texture => texture.dispose());
  textureCache.clear();
}
