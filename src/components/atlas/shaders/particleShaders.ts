// ============= GPU PARTICLE SHADERS =============
// Optimized for performance with proper smooth simplex noise

// Simplex 3D noise implementation for smooth, continuous turbulence
const simplexNoise3D = `
  // Simplex 3D noise - smooth and temporally coherent
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    // First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    // Permutations
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    // Gradients: 7x7 points over a square, mapped onto an octahedron
    float n_ = 0.142857142857; // 1.0/7.0
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    // Normalize gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

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
  uniform float uTurbulenceFrequency;
  uniform float uTurbulenceSpeed;
  uniform float uEnableTurbulence;
  uniform vec3 uMousePos;
  uniform float uMouseActive;
  uniform float uMouseStrength;
  uniform float uMouseRadius;
  uniform float uMouseMode;
  uniform vec3 uColor;
  uniform float uFluidCohesion;
  uniform float uSurfaceTension;
  uniform float uFluidFlow;
  
  varying float vIntensity;
  varying vec3 vColor;
  
  ${simplexNoise3D}
  
  void main() {
    // Simple morph
    float adjustedMorph = clamp(uMorphProgress + particleOffset * 0.2 - 0.1, 0.0, 1.0);
    vec3 pos = mix(scatteredPos, spherePos, adjustedMorph);
    
    float dist = length(pos);
    vec3 normal = pos / max(dist, 0.1);
    
    // Audio displacement
    float effectiveAudio = uAudioLevel * uAudioMultiplier;
    pos += normal * effectiveAudio * 0.3;
    
    // Smooth turbulence using simplex noise
    if (uEnableTurbulence > 0.5) {
      float t = uTime * uTurbulenceSpeed;
      vec3 noiseInput = pos * uTurbulenceFrequency;
      
      // Use smooth simplex noise with time-offset for each axis
      vec3 turb = vec3(
        snoise(noiseInput + vec3(t, 0.0, 0.0)),
        snoise(noiseInput + vec3(0.0, t, 0.0)),
        snoise(noiseInput + vec3(0.0, 0.0, t))
      ) * uTurbulenceAmplitude;
      
      pos += turb;
    }
    
    // Fluid dynamics
    if (uFluidFlow > 0.01) {
      vec3 flowDir = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
      pos += flowDir * uFluidFlow * sin(uTime * 0.5 + randomSeed * 6.28) * 0.15;
    }
    
    // Surface tension - pulls particles toward target radius
    if (uSurfaceTension > 0.01) {
      float targetDist = 1.8 * uDensity;
      pos += normal * (targetDist - dist) * uSurfaceTension * 0.1;
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
