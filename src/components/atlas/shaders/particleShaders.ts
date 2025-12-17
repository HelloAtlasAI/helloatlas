// ============= GPU PARTICLE SHADERS =============
// All particle calculations happen on the GPU for maximum performance

export const gpuParticleVertexShader = `
  precision highp float;
  
  // Attributes - per-particle data stored once
  attribute vec3 spherePos;
  attribute vec3 scatteredPos;
  attribute float particleOffset;
  attribute float randomSeed;
  
  // Uniforms - updated each frame
  uniform float uTime;
  uniform float uMorphProgress;
  uniform float uAudioLevel;
  uniform float uAudioMultiplier;
  uniform float uAudioReactivitySpeed;
  uniform float uParticleSize;
  uniform float uDensity;
  uniform float uFluidCohesion;
  uniform float uSurfaceTension;
  uniform float uFluidFlow;
  uniform float uTurbulenceFrequency;
  uniform float uTurbulenceAmplitude;
  uniform float uTurbulenceSpeed;
  uniform float uEnableTurbulence;
  uniform vec3 uMousePos;
  uniform float uMouseActive;
  uniform float uMouseStrength;
  uniform float uMouseRadius;
  uniform float uMouseMode;
  uniform vec3 uColor;
  
  varying float vIntensity;
  varying vec3 vColor;
  
  // Improved continuous hash function - no discontinuities
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  
  // Smooth 3D noise with proper interpolation
  float noise3D(vec3 p, float freq) {
    vec3 fp = p * freq;
    vec3 i = floor(fp);
    vec3 f = fract(fp);
    // Smoother Hermite interpolation (prevents discontinuities)
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    
    float n = mix(
      mix(
        mix(hash(i), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
        f.y
      ),
      f.z
    );
    return n * 2.0 - 1.0;
  }
  
  // Easing function
  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }
  
  void main() {
    // Morphing with per-particle offset for organic feel
    float adjustedMorph = clamp(uMorphProgress * (1.0 + particleOffset) - particleOffset * 0.5, 0.0, 1.0);
    adjustedMorph = easeInOutCubic(adjustedMorph);
    
    // Interpolate between scattered and sphere positions
    vec3 pos = mix(scatteredPos, spherePos, adjustedMorph);
    
    // Calculate distance and normal with safe minimum
    float dist = max(length(pos), 0.1);
    vec3 normal = pos / dist;
    
    // Fluid cohesion - push toward uniform radius
    if (uFluidCohesion > 0.0) {
      float baseRadius = 1.8 * uDensity;
      float radiusVariation = (1.0 - uFluidCohesion) * 0.4;
      float targetRadius = baseRadius + (particleOffset - 0.2) * radiusVariation * baseRadius;
      float radiusDiff = targetRadius - dist;
      float tensionForce = clamp(radiusDiff * uSurfaceTension * uFluidCohesion, -0.5, 0.5);
      pos += normal * tensionForce;
      
      // Fluid flow
      if (uFluidFlow > 0.0 && uFluidCohesion > 0.3) {
        float flowSpeed = uFluidFlow * uFluidCohesion * 0.02;
        float flowAngle = uTime * flowSpeed + particleOffset * 6.28318;
        vec3 tangent = vec3(
          -normal.y * cos(flowAngle) + (-normal.x * normal.z) * sin(flowAngle),
          normal.x * cos(flowAngle) + (-normal.y * normal.z) * sin(flowAngle),
          (normal.x * normal.x + normal.y * normal.y) * sin(flowAngle)
        );
        pos += tangent * flowSpeed * dist;
      }
    }
    
    // Audio reactive morphing with smoothstep
    float effectiveAudio = uAudioLevel * uAudioMultiplier;
    if (effectiveAudio > 0.01) {
      float audioDisplacement = smoothstep(0.0, 1.0, effectiveAudio) * 0.4;
      pos += normal * audioDisplacement;
      
      float wavePhase = uTime * 10.0 * uAudioReactivitySpeed + dist * 6.0 + particleOffset * 3.14159;
      float audioWave = sin(wavePhase) * smoothstep(0.0, 0.5, effectiveAudio) * 0.2 * uAudioReactivitySpeed;
      pos += normal * audioWave;
    }
    
    // Turbulence with clamped output
    if (uEnableTurbulence > 0.5 && uTurbulenceAmplitude > 0.001) {
      float turbScale = 1.0 - uFluidCohesion * 0.7;
      float audioBoost = 1.0 + smoothstep(0.0, 1.0, effectiveAudio) * 2.5;
      float noiseTime = uTime * uTurbulenceSpeed;
      
      vec3 turbulence = vec3(
        noise3D(pos + vec3(noiseTime, 0.0, 0.0), uTurbulenceFrequency),
        noise3D(pos + vec3(0.0, noiseTime, 0.0), uTurbulenceFrequency),
        noise3D(pos + vec3(0.0, 0.0, noiseTime), uTurbulenceFrequency)
      ) * uTurbulenceAmplitude * turbScale * audioBoost;
      
      turbulence = clamp(turbulence, vec3(-0.5), vec3(0.5));
      pos += turbulence;
    }
    
    // Mouse interaction
    if (uMouseActive > 0.5) {
      vec3 toMouse = uMousePos - pos;
      float mouseDist = max(length(toMouse), 0.1);
      if (mouseDist < uMouseRadius) {
        float influence = smoothstep(uMouseRadius, 0.0, mouseDist) * uMouseStrength * 0.3;
        pos += normalize(toMouse) * influence * uMouseMode;
      }
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float baseSize = uParticleSize * (300.0 / max(-mvPosition.z, 0.1));
    gl_PointSize = clamp(baseSize, 1.0, 64.0);
    
    vIntensity = clamp(0.7 + effectiveAudio * 0.3 + (1.0 - adjustedMorph) * 0.2, 0.0, 1.5);
    vColor = uColor;
  }
`;

export const gpuParticleFragmentShader = `
  precision highp float;
  
  uniform sampler2D uTexture;
  uniform float uOpacity;
  
  varying float vIntensity;
  varying vec3 vColor;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vIntensity * uOpacity;
    alpha = clamp(alpha, 0.0, 1.0);
    
    vec3 finalColor = vColor + vColor * 0.3 * max(1.0 - dist * 2.0, 0.0);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// GPU Core particle shader - fully GPU-based for core particles
export const gpuCoreVertexShader = `
  precision highp float;
  
  attribute vec3 spherePos;
  attribute vec3 scatteredPos;
  attribute float particleOffset;
  
  uniform float uTime;
  uniform float uMorphProgress;
  uniform float uAudioLevel;
  uniform float uCoreDensity;
  uniform float uPulseSpeed;
  uniform float uFluidCohesion;
  uniform float uSurfaceTension;
  uniform float uFluidFlow;
  uniform vec3 uCoreColor;
  uniform float uCoreSize;
  
  varying float vIntensity;
  varying vec3 vColor;
  
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  
  float noise3D(vec3 p, float freq) {
    vec3 fp = p * freq;
    vec3 i = floor(fp);
    vec3 f = fract(fp);
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    
    float n = mix(
      mix(
        mix(hash(i), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
        f.y
      ),
      f.z
    );
    return n * 2.0 - 1.0;
  }
  
  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }
  
  void main() {
    float adjustedMorph = clamp(uMorphProgress * (1.0 + particleOffset) - particleOffset * 0.5, 0.0, 1.0);
    adjustedMorph = easeInOutCubic(adjustedMorph);
    
    vec3 pos = mix(scatteredPos, spherePos, adjustedMorph);
    
    float dist = max(length(pos), 0.1);
    vec3 normal = pos / dist;
    
    // Fluid cohesion for core
    if (uFluidCohesion > 0.0) {
      float baseRadius = uCoreDensity * 1.5;
      float radiusVariation = (1.0 - uFluidCohesion) * 0.3;
      float targetRadius = baseRadius + (particleOffset - 0.2) * radiusVariation * baseRadius;
      float radiusDiff = targetRadius - dist;
      float tensionForce = clamp(radiusDiff * uSurfaceTension * uFluidCohesion, -0.3, 0.3);
      pos += normal * tensionForce;
      
      if (uFluidFlow > 0.0 && uFluidCohesion > 0.3) {
        float flowSpeed = uFluidFlow * uFluidCohesion * 0.03;
        float flowAngle = uTime * flowSpeed * 2.0 + particleOffset * 6.28318;
        vec3 tangent = vec3(
          -normal.y * cos(flowAngle) + (-normal.x * normal.z) * sin(flowAngle),
          normal.x * cos(flowAngle) + (-normal.y * normal.z) * sin(flowAngle),
          (normal.x * normal.x + normal.y * normal.y) * sin(flowAngle)
        );
        pos += tangent * flowSpeed * dist;
      }
    }
    
    // Core-specific turbulence
    float turbScale = 1.0 - uFluidCohesion * 0.8;
    float turbTime = uTime * 2.0;
    vec3 turb = vec3(
      noise3D(pos * 3.0 + vec3(turbTime, 0.0, 0.0), 1.5),
      noise3D(pos * 3.0 + vec3(0.0, turbTime, 0.0), 1.5),
      noise3D(pos * 3.0 + vec3(0.0, 0.0, turbTime), 1.5)
    ) * 0.02 * turbScale;
    pos += turb;
    
    // Core pulse
    float pulse = 1.0 + sin(uTime * uPulseSpeed * 2.0) * 0.1 + uAudioLevel * 0.2;
    pos *= pulse;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = clamp(uCoreSize * (300.0 / max(-mvPosition.z, 0.1)), 1.0, 32.0);
    
    vIntensity = 0.6 + uAudioLevel * 0.3;
    vColor = uCoreColor;
  }
`;

export const gpuCoreFragmentShader = `
  precision highp float;
  
  uniform float uOpacity;
  
  varying float vIntensity;
  varying vec3 vColor;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vIntensity * uOpacity;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;
