/**
 * Resource Manager for THREE.js and other heavy resources
 * Provides centralized resource management with automatic cleanup
 */

import * as THREE from 'three';

interface ResourceEntry {
  resource: THREE.Texture | THREE.BufferGeometry | THREE.Material;
  refCount: number;
  lastAccessed: number;
}

class ResourceManagerClass {
  private textures = new Map<string, ResourceEntry>();
  private geometries = new Map<string, ResourceEntry>();
  private materials = new Map<string, ResourceEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly maxAge = 60000; // 1 minute
  private readonly cleanupFrequency = 30000; // 30 seconds

  constructor() {
    this.startAutoCleanup();
  }

  private startAutoCleanup(): void {
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupUnused();
      }, this.cleanupFrequency);
    }
  }

  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Texture management
  getTexture(key: string, createFn: () => THREE.Texture): THREE.Texture {
    const entry = this.textures.get(key);
    if (entry) {
      entry.refCount++;
      entry.lastAccessed = Date.now();
      return entry.resource as THREE.Texture;
    }

    const texture = createFn();
    this.textures.set(key, {
      resource: texture,
      refCount: 1,
      lastAccessed: Date.now(),
    });
    return texture;
  }

  releaseTexture(key: string): void {
    const entry = this.textures.get(key);
    if (entry) {
      entry.refCount--;
      if (entry.refCount <= 0) {
        (entry.resource as THREE.Texture).dispose();
        this.textures.delete(key);
      }
    }
  }

  // Geometry management
  getGeometry(key: string, createFn: () => THREE.BufferGeometry): THREE.BufferGeometry {
    const entry = this.geometries.get(key);
    if (entry) {
      entry.refCount++;
      entry.lastAccessed = Date.now();
      return entry.resource as THREE.BufferGeometry;
    }

    const geometry = createFn();
    this.geometries.set(key, {
      resource: geometry,
      refCount: 1,
      lastAccessed: Date.now(),
    });
    return geometry;
  }

  releaseGeometry(key: string): void {
    const entry = this.geometries.get(key);
    if (entry) {
      entry.refCount--;
      if (entry.refCount <= 0) {
        (entry.resource as THREE.BufferGeometry).dispose();
        this.geometries.delete(key);
      }
    }
  }

  // Material management
  getMaterial(key: string, createFn: () => THREE.Material): THREE.Material {
    const entry = this.materials.get(key);
    if (entry) {
      entry.refCount++;
      entry.lastAccessed = Date.now();
      return entry.resource as THREE.Material;
    }

    const material = createFn();
    this.materials.set(key, {
      resource: material,
      refCount: 1,
      lastAccessed: Date.now(),
    });
    return material;
  }

  releaseMaterial(key: string): void {
    const entry = this.materials.get(key);
    if (entry) {
      entry.refCount--;
      if (entry.refCount <= 0) {
        (entry.resource as THREE.Material).dispose();
        this.materials.delete(key);
      }
    }
  }

  // Cleanup unused resources
  private cleanupUnused(): void {
    const now = Date.now();

    const cleanup = <T extends ResourceEntry>(map: Map<string, T>) => {
      for (const [key, entry] of map.entries()) {
        if (entry.refCount <= 0 && now - entry.lastAccessed > this.maxAge) {
          if ('dispose' in entry.resource) {
            entry.resource.dispose();
          }
          map.delete(key);
        }
      }
    };

    cleanup(this.textures);
    cleanup(this.geometries);
    cleanup(this.materials);
  }

  // Force dispose all resources
  disposeAll(): void {
    this.textures.forEach((entry) => (entry.resource as THREE.Texture).dispose());
    this.geometries.forEach((entry) => (entry.resource as THREE.BufferGeometry).dispose());
    this.materials.forEach((entry) => (entry.resource as THREE.Material).dispose());
    
    this.textures.clear();
    this.geometries.clear();
    this.materials.clear();
  }

  // Get memory usage stats
  getStats(): { textures: number; geometries: number; materials: number } {
    return {
      textures: this.textures.size,
      geometries: this.geometries.size,
      materials: this.materials.size,
    };
  }
}

export const resourceManager = new ResourceManagerClass();

// Cleanup helper for React components
export const disposeObject3D = (object: THREE.Object3D): void => {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    if (child instanceof THREE.Points) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
};

// Animation frame manager
export class AnimationManager {
  private animations = new Map<string, number>();

  request(key: string, callback: FrameRequestCallback): void {
    this.cancel(key);
    this.animations.set(key, requestAnimationFrame(callback));
  }

  cancel(key: string): void {
    const id = this.animations.get(key);
    if (id !== undefined) {
      cancelAnimationFrame(id);
      this.animations.delete(key);
    }
  }

  cancelAll(): void {
    this.animations.forEach((id) => cancelAnimationFrame(id));
    this.animations.clear();
  }
}

export const animationManager = new AnimationManager();
