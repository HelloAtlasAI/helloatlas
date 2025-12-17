// Nebula Flow Shaders - Curl noise flow fields with neon gradient, rim lighting, and high-quality particles

// Shared simplex noise for curl calculation
const simplexNoise3D = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

// Curl noise for divergence-free flow
const curlNoise = `
vec3 curlNoise(vec3 p, float time) {
  float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  
  // Sample noise at offset positions
  float n1 = snoise(p + dy + vec3(0.0, 0.0, time * 0.1));
  float n2 = snoise(p - dy + vec3(0.0, 0.0, time * 0.1));
  float n3 = snoise(p + dz + vec3(0.0, time * 0.1, 0.0));
  float n4 = snoise(p - dz + vec3(0.0, time * 0.1, 0.0));
  float n5 = snoise(p + dx + vec3(time * 0.1, 0.0, 0.0));
  float n6 = snoise(p - dx + vec3(time * 0.1, 0.0, 0.0));
  
  // Curl = nabla x F (cross product of gradient)
  float x = (n1 - n2) - (n3 - n4);
  float y = (n3 - n4) - (n5 - n6);
  float z = (n5 - n6) - (n1 - n2);
  
  return normalize(vec3(x, y, z) / (2.0 * e));
}
`;

export const nebulaFlowVertexShader = `
${simplexNoise3D}
${curlNoise}

attribute vec3 spherePos;
attribute float bandIndex;
attribute float flowOffset;
attribute float randomSeed;

uniform float uTime;
uniform float uMorphProgress;
uniform float uAudioLevel;
uniform float uParticleSize;
uniform float uFlowStrength;
uniform float uFlowSpeed;
uniform float uBreathingSpeed;
uniform float uBreathingAmount;
uniform float uRadiusNoise;
uniform float uSolidSurface;
uniform float uCoherence;
uniform float uSurfaceBlend;
uniform float uUniformSize;

varying float vIntensity;
varying float vFlowPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying float vBandValue;
varying float vHotSpot;
varying float vDepth;
varying float vRandomSeed;
varying float vSolidSurface;

void main() {
  vec3 pos = spherePos;
  vec3 normal = normalize(spherePos);
  
  // In solid surface mode, all particles breathe together uniformly
  float breathePhase = uSolidSurface > 0.5 
    ? uTime * uBreathingSpeed  // Uniform breathing for solid surface
    : uTime * uBreathingSpeed + randomSeed * 6.28;  // Per-particle variation
    
  float breathe = sin(breathePhase) * uBreathingAmount;
  float radiusMultiplier = 1.0 + breathe;
  
  // Mix between coherent and per-particle noise based on coherence setting
  float coherentNoise = snoise(normal * 2.0 + uTime * 0.1);
  float particleNoise = snoise(normal * 2.0 + uTime * 0.1 + randomSeed * 10.0);
  float radiusNoise = mix(particleNoise, coherentNoise, uCoherence) * uRadiusNoise;
  radiusMultiplier += radiusNoise;
  
  // Apply radius modifications
  pos = normal * length(spherePos) * radiusMultiplier;
  
  // Curl noise flow - coherent in solid surface mode
  vec3 flowPos = pos * 0.5 + vec3(uTime * uFlowSpeed * 0.1);
  vec3 curlDir = curlNoise(flowPos, uTime * uFlowSpeed);
  
  // Flow along surface - project curl onto tangent plane
  vec3 tangentFlow = curlDir - normal * dot(curlDir, normal);
  tangentFlow = normalize(tangentFlow) * uFlowStrength;
  
  // Apply flow displacement - in solid surface mode, more coherent
  float bandPhase = bandIndex * 6.28 + uTime * uFlowSpeed * 0.5;
  float flowModulation = uSolidSurface > 0.5
    ? sin(bandPhase) * 0.5 + 0.5  // Coherent wave
    : sin(bandPhase + flowOffset * 3.14159) * 0.5 + 0.5;  // Per-particle variation
  
  pos += tangentFlow * flowModulation * 0.3 * (1.0 - uSolidSurface * 0.5);
  
  // Audio reactivity with multi-layer displacement
  float audioWave = uSolidSurface > 0.5
    ? sin(uTime * 4.0) * 0.5 + 0.5  // Uniform audio wave
    : sin(uTime * 4.0 + randomSeed * 6.28) * 0.5 + 0.5;  // Per-particle variation
  pos += normal * uAudioLevel * 0.25 * (0.5 + audioWave * 0.5);
  
  // Calculate intensity for coloring - more variation
  vIntensity = 0.5 + randomSeed * 0.5;
  vIntensity += uAudioLevel * 0.4;
  vIntensity *= (0.8 + flowModulation * 0.4);
  
  // In solid surface mode, more uniform intensity
  vIntensity = mix(vIntensity, 0.85, uSolidSurface * 0.7);
  
  // Flow position for gradient (0-1 along flow bands)
  vFlowPosition = flowModulation;
  
  // Band value for contour coloring
  vBandValue = bandIndex;
  
  // Hot spot noise - brighter clusters on ridges
  float hotSpotNoise = snoise(pos * 3.0 + vec3(uTime * 0.2, 0.0, 0.0));
  vHotSpot = smoothstep(0.3, 0.8, hotSpotNoise);
  
  // In solid surface mode, reduce hot spot variation
  vHotSpot = mix(vHotSpot, 0.5, uSolidSurface * 0.6);
  
  // Random seed for fragment shader
  vRandomSeed = randomSeed;
  vSolidSurface = uSolidSurface;
  
  // Transform to view space for rim lighting
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = mvPosition.xyz;
  vWorldNormal = normalize(normalMatrix * normal);
  vDepth = -mvPosition.z;
  
  gl_Position = projectionMatrix * mvPosition;
  
  // Particle size with audio reactivity and depth-based sizing
  float depthFactor = smoothstep(2.0, 8.0, -mvPosition.z);
  float sizeMultiplier = 1.0 + uAudioLevel * 0.6;
  sizeMultiplier *= (1.0 + depthFactor * 0.3); // Bigger particles farther away for volumetric feel
  
  // In solid surface mode, use larger uniform size for overlap
  float solidSizeBoost = uSolidSurface * uUniformSize;
  sizeMultiplier *= (1.0 + solidSizeBoost);
  
  gl_PointSize = uParticleSize * (300.0 / -mvPosition.z) * sizeMultiplier;
}
`;

export const nebulaFlowFragmentShader = `
uniform vec3 uColorStart;   // Deep indigo
uniform vec3 uColorMid;     // Electric violet
uniform vec3 uColorEnd;     // Icy blue
uniform float uRimIntensity;
uniform float uHotSpotIntensity;
uniform float uOpacity;
uniform float uGlowIntensity;
uniform float uDepthFade;
uniform float uCoreGlow;
uniform float uAudioLevel;
uniform float uSurfaceBlend;

varying float vIntensity;
varying float vFlowPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying float vBandValue;
varying float vHotSpot;
varying float vDepth;
varying float vRandomSeed;
varying float vSolidSurface;

void main() {
  // High-quality circular point with Gaussian falloff
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  if (dist > 0.5) discard;
  
  // Softer falloff for solid surface mode - particles blend together seamlessly
  float blendFactor = vSolidSurface > 0.5 ? uSurfaceBlend : 1.0;
  
  // Much softer Gaussian for blending in solid surface mode
  float gaussFalloff = exp(-dist * dist * (6.0 / blendFactor));
  
  // Inner core glow - bright center (reduced in solid surface mode for smooth look)
  float coreFactor = vSolidSurface > 0.5 ? 0.5 : 1.0;
  float core = exp(-dist * dist * 16.0) * uCoreGlow * coreFactor;
  
  // Softer edges that blend seamlessly
  float softEdge = 1.0 - smoothstep(0.2 * blendFactor, 0.5, dist);
  
  // Rim lighting - brighter at edges based on view direction
  vec3 viewDir = normalize(-vViewPosition);
  float rimDot = 1.0 - abs(dot(vWorldNormal, viewDir));
  float rim = pow(rimDot, 2.0) * uRimIntensity;
  
  // In solid surface mode, reduce rim for more uniform appearance
  rim *= (1.0 - vSolidSurface * 0.5);
  
  // Audio-reactive rim boost
  rim *= (1.0 + uAudioLevel * 0.5);
  
  // 3-color gradient based on flow position and band
  float gradientPos = vFlowPosition * 0.7 + vBandValue * 0.3;
  gradientPos = clamp(gradientPos, 0.0, 1.0);
  
  // Smooth 3-color blend: start -> mid -> end
  vec3 color;
  if (gradientPos < 0.5) {
    color = mix(uColorStart, uColorMid, gradientPos * 2.0);
  } else {
    color = mix(uColorMid, uColorEnd, (gradientPos - 0.5) * 2.0);
  }
  
  // Add rim lighting contribution - shifts toward icy blue at edges
  color = mix(color, uColorEnd, rim * 0.5);
  
  // Add hot spot brightness with subtle color shift
  vec3 hotSpotColor = mix(color, vec3(1.0), 0.3);
  color = mix(color, hotSpotColor, vHotSpot * uHotSpotIntensity * 0.5);
  
  // Core glow - bright white-ish center
  vec3 coreColor = mix(color, vec3(1.0, 0.95, 0.9), core * 0.5);
  color = mix(color, coreColor, core);
  
  // HDR boost for bloom-friendly values
  float hdrBoost = 1.0 + rim * 0.4 + core * 0.3 + uAudioLevel * 0.3;
  color *= vIntensity * hdrBoost * uGlowIntensity;
  
  // Depth-based fog for volumetric feel
  float depthFog = smoothstep(3.0, 8.0, vDepth) * uDepthFade;
  color = mix(color, uColorStart * 0.5, depthFog * 0.4);
  
  // Multi-layer alpha for depth and soft blending
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  float alpha = gaussFalloff * softEdge * uOpacity * vIntensity;
  
  // In solid surface mode, boost alpha for overlap and seamless blending
  float solidAlphaBoost = vSolidSurface > 0.5 ? blendFactor * 0.7 : 1.0;
  alpha *= solidAlphaBoost;
  
  alpha *= (0.6 + luminance * 0.4); // Brighter particles more opaque
  alpha += rim * 0.25 * (1.0 - vSolidSurface * 0.5); // Extra glow at rim
  alpha += core * 0.3; // Core is more solid
  alpha = clamp(alpha, 0.0, 1.0);
  
  // Subtle variation per particle (less in solid surface mode)
  float variationAmount = vSolidSurface > 0.5 ? 0.05 : 0.15;
  alpha *= (1.0 - variationAmount + vRandomSeed * variationAmount);
  
  gl_FragColor = vec4(color, alpha);
}
`;
