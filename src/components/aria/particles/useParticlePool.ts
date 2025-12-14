import { useMemo, useRef, useCallback } from "react";
import * as THREE from "three";

export enum ParticleState {
  UNIVERSE = 0,
  SPHERE = 1,
  HUD = 2,
}

export interface ParticlePoolConfig {
  count: number;
  universeRadius: number;
  sphereRadius: number;
}

export interface ParticlePool {
  positions: Float32Array;
  velocities: Float32Array;
  targets: Float32Array;
  states: Float32Array;
  alphas: Float32Array;
  colors: Float32Array;
  count: number;
}

export const useParticlePool = (config: ParticlePoolConfig = {
  count: 200000,
  universeRadius: 15,
  sphereRadius: 0.8,
}) => {
  const poolRef = useRef<ParticlePool | null>(null);

  const pool = useMemo(() => {
    const { count, universeRadius } = config;
    
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const states = new Float32Array(count);
    const alphas = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random spherical distribution for universe particles
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * universeRadius;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      // Slow random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
      
      // Initial targets = current position
      targets[i3] = positions[i3];
      targets[i3 + 1] = positions[i3 + 1];
      targets[i3 + 2] = positions[i3 + 2];
      
      // All start as universe particles
      states[i] = ParticleState.UNIVERSE;
      alphas[i] = 0.15 + Math.random() * 0.15;
      
      // Dim blue-purple colors
      colors[i3] = 0.02 + Math.random() * 0.03;
      colors[i3 + 1] = 0.05 + Math.random() * 0.1;
      colors[i3 + 2] = 0.15 + Math.random() * 0.2;
    }

    const poolData: ParticlePool = {
      positions,
      velocities,
      targets,
      states,
      alphas,
      colors,
      count,
    };
    
    poolRef.current = poolData;
    return poolData;
  }, [config.count, config.universeRadius]);

  const requestParticles = useCallback((
    targetPositions: Float32Array,
    hudElementId: string,
    count: number
  ) => {
    if (!poolRef.current) return [];
    
    const pool = poolRef.current;
    const assignedIndices: number[] = [];
    let assigned = 0;
    
    for (let i = 0; i < pool.count && assigned < count; i++) {
      if (pool.states[i] === ParticleState.UNIVERSE) {
        pool.states[i] = ParticleState.HUD;
        
        const i3 = i * 3;
        const t3 = assigned * 3;
        
        pool.targets[i3] = targetPositions[t3];
        pool.targets[i3 + 1] = targetPositions[t3 + 1];
        pool.targets[i3 + 2] = targetPositions[t3 + 2];
        
        assignedIndices.push(i);
        assigned++;
      }
    }
    
    return assignedIndices;
  }, []);

  const releaseParticles = useCallback((indices: number[]) => {
    if (!poolRef.current) return;
    
    const pool = poolRef.current;
    
    for (const i of indices) {
      pool.states[i] = ParticleState.UNIVERSE;
      
      const i3 = i * 3;
      // Add random velocity for dissolve effect
      pool.velocities[i3] = (Math.random() - 0.5) * 0.1;
      pool.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      pool.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
    }
  }, []);

  return {
    pool,
    requestParticles,
    releaseParticles,
  };
};
