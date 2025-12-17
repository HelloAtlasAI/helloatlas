// ============= GPU PARTICLE SHADERS =============
// Optimized for performance - simplified noise calculations

export const gpuParticleVertexShader = `
  precision mediump float;
  
  attribute vec3 spherePos;
  attribute vec3 scatteredPos;
  attribute float particleOffset;
  attribute float randomSeed;
  
  uniform float uTime;
  uniform float uMorphProgress;
  uniform float uAudioLevel;
  uniform float uAudioMultiplier;
  uniform float uParticleSize;
  uniform float uDensity;
  uniform float uTurbulenceAmplitude;
  uniform float uEnableTurbulence;
  uniform vec3 uMousePos;
  uniform float uMouseActive;
  uniform float uMouseStrength;
  uniform float uMouseRadius;
  uniform float uMouseMode;
  uniform vec3 uColor;
  
  varying float vIntensity;
  varying vec3 vColor;
  
  // Simple fast noise
  float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
  }
  
  void main() {
    // Simple morph
    float adjustedMorph = clamp(uMorphProgress + particleOffset * 0.2 - 0.1, 0.0, 1.0);
    vec3 pos = mix(scatteredPos, spherePos, adjustedMorph);
    
    float dist = length(pos);
    vec3 normal = pos / max(dist, 0.1);
    
    // Audio displacement
    float effectiveAudio = uAudioLevel * uAudioMultiplier;
    pos += normal * effectiveAudio * 0.3;
    
    // Simple turbulence
    if (uEnableTurbulence > 0.5) {
      float t = uTime * 0.5;
      vec3 turb = vec3(
        noise(pos + t) - 0.5,
        noise(pos + t + 100.0) - 0.5,
        noise(pos + t + 200.0) - 0.5
      ) * uTurbulenceAmplitude * 2.0;
      pos += turb;
    }
    
    // Mouse interaction
    if (uMouseActive > 0.5) {
      vec3 toMouse = uMousePos - pos;
      float mouseDist = length(toMouse);
      if (mouseDist < uMouseRadius) {
        float influence = (1.0 - mouseDist / uMouseRadius) * uMouseStrength * 0.3;
        pos += normalize(toMouse) * influence * uMouseMode;
      }
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(uParticleSize * (250.0 / -mvPosition.z), 1.0, 50.0);
    
    vIntensity = 0.7 + effectiveAudio * 0.3;
    vColor = uColor;
  }
`;

export const gpuParticleFragmentShader = `
  precision mediump float;
  
  uniform float uOpacity;
  
  varying float vIntensity;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - dist * 2.0) * vIntensity * uOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// GPU Core particle shader - simplified
export const gpuCoreVertexShader = `
  precision mediump float;
  
  attribute vec3 spherePos;
  attribute vec3 scatteredPos;
  attribute float particleOffset;
  
  uniform float uTime;
  uniform float uMorphProgress;
  uniform float uAudioLevel;
  uniform float uPulseSpeed;
  uniform vec3 uCoreColor;
  uniform float uCoreSize;
  
  varying float vIntensity;
  varying vec3 vColor;
  
  void main() {
    float adjustedMorph = clamp(uMorphProgress + particleOffset * 0.2 - 0.1, 0.0, 1.0);
    vec3 pos = mix(scatteredPos, spherePos, adjustedMorph);
    
    // Simple pulse
    float pulse = 1.0 + sin(uTime * uPulseSpeed) * 0.1 + uAudioLevel * 0.15;
    pos *= pulse;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(uCoreSize * (250.0 / -mvPosition.z), 1.0, 24.0);
    
    vIntensity = 0.6 + uAudioLevel * 0.3;
    vColor = uCoreColor;
  }
`;

export const gpuCoreFragmentShader = `
  precision mediump float;
  
  uniform float uOpacity;
  
  varying float vIntensity;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - dist * 2.0) * vIntensity * uOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;
