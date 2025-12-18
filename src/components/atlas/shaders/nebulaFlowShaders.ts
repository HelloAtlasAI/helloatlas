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

// Optimized curl noise - reduced from 6 to 2 noise samples for performance
const curlNoiseFast = `
vec3 curlNoiseFast(vec3 p, float time) {
  // Simplified curl approximation with only 2 noise samples
  float slowTime = time * 0.08; // Slower for smoother animation
  float n1 = snoise(p + vec3(0.0, 0.0, slowTime));
  float n2 = snoise(p + vec3(0.0, slowTime, 0.0));
  
  return normalize(vec3(
    n1 * 0.5 - 0.25,
    n2 * 0.5 - 0.25,
    (n1 + n2) * 0.25
  ));
}
`;

export const nebulaFlowVertexShader = `
${simplexNoise3D}
${curlNoiseFast}

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
// Pixel-stable rendering uniforms
uniform float uPixelRatio;
uniform vec2 uResolution;
uniform float uPointSizePx;
// State behavior uniforms
uniform float uCoreRetraction;
uniform float uAudioReactive;
uniform float uAudioBreathing;

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
  
  // Core retraction - particles pull toward center during thinking state
  float retractionAmount = uCoreRetraction * 0.4;
  float baseRadius = length(spherePos) * (1.0 - retractionAmount);
  
  // Breathing phase
  float breathePhase = uSolidSurface > 0.5 
    ? uTime * uBreathingSpeed
    : uTime * uBreathingSpeed + randomSeed * 6.28;
  
  // Audio-reactive breathing
  float effectiveBreathingAmount = uAudioReactive > 0.5 
    ? uAudioLevel * uAudioBreathing * 2.5
    : uBreathingAmount;
    
  float breathe = sin(breathePhase) * effectiveBreathingAmount;
  float radiusMultiplier = 1.0 + breathe;
  
  // Direct audio pulse for speaking
  float audioDirectPulse = uAudioReactive > 0.5 ? uAudioLevel * 0.1 : 0.0;
  radiusMultiplier += audioDirectPulse;
  
  // Mix between coherent and per-particle noise
  float slowNoiseTime = uTime * 0.15;
  float coherentNoise = snoise(normal * 1.5 + slowNoiseTime);
  float particleNoise = snoise(normal * 1.5 + slowNoiseTime + randomSeed * 10.0);
  float radiusNoise = mix(particleNoise, coherentNoise, uCoherence) * uRadiusNoise;
  radiusMultiplier += radiusNoise;
  
  // Apply radius modifications
  pos = normal * baseRadius * radiusMultiplier;
  
  // Curl noise flow
  vec3 flowPos = pos * 0.4 + vec3(uTime * uFlowSpeed * 0.08);
  vec3 curlDir = curlNoiseFast(flowPos, uTime * uFlowSpeed);
  
  // Flow along surface
  vec3 tangentFlow = curlDir - normal * dot(curlDir, normal);
  tangentFlow = normalize(tangentFlow) * uFlowStrength;
  
  // Apply flow displacement
  float bandPhase = bandIndex * 6.28 + uTime * uFlowSpeed * 0.4;
  float flowModulation = uSolidSurface > 0.5
    ? sin(bandPhase) * 0.5 + 0.5
    : sin(bandPhase + flowOffset * 3.14159) * 0.5 + 0.5;
  
  pos += tangentFlow * flowModulation * 0.25 * (1.0 - uSolidSurface * 0.5);
  
  // Audio reactivity
  float audioWave = uSolidSurface > 0.5
    ? sin(uTime * 3.0) * 0.5 + 0.5
    : sin(uTime * 3.0 + randomSeed * 6.28) * 0.5 + 0.5;
  pos += normal * uAudioLevel * 0.2 * (0.5 + audioWave * 0.5);
  
  // Calculate intensity
  vIntensity = 0.5 + randomSeed * 0.5;
  vIntensity += uAudioLevel * 0.4;
  vIntensity *= (0.8 + flowModulation * 0.4);
  vIntensity = mix(vIntensity, 0.85, uSolidSurface * 0.7);
  
  vFlowPosition = flowModulation;
  vBandValue = bandIndex;
  
  // Hot spot noise
  float hotSpotNoise = snoise(pos * 1.8 + vec3(uTime * 0.12, 0.0, 0.0));
  vHotSpot = smoothstep(0.3, 0.8, hotSpotNoise);
  vHotSpot = mix(vHotSpot, 0.5, uSolidSurface * 0.6);
  
  vRandomSeed = randomSeed;
  vSolidSurface = uSolidSurface;
  
  // Transform to view space
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = mvPosition.xyz;
  vWorldNormal = normalize(normalMatrix * normal);
  vDepth = -mvPosition.z;
  
  gl_Position = projectionMatrix * mvPosition;
  
  // PIXEL-STABLE POINT SIZE CALCULATION
  // Base size in CSS pixels with audio reactivity
  float baseSizePx = uPointSizePx * (1.0 + uAudioLevel * 0.4);
  
  // Solid surface size boost
  float solidSizeBoost = uSolidSurface * uUniformSize * 0.3;
  baseSizePx *= (1.0 + solidSizeBoost);
  
  // Proper perspective projection for screen-space stable sizing
  // Use canvas height and camera FOV (50 degrees) for correct projection
  float tanHalfFov = 0.4663; // tan(50° / 2) = tan(25°)
  float screenHeight = max(uResolution.y, 50.0);
  float depth = max(-mvPosition.z, 0.1);
  
  // Project to screen space: how many pixels should this point be?
  float projectedSize = (baseSizePx * screenHeight) / (tanHalfFov * depth * 2.0);
  
  // Scale by pixel ratio for crisp high-DPI rendering
  gl_PointSize = projectedSize * uPixelRatio;
  
  // Clamp to reasonable range - particles should be small dots, not squares
  gl_PointSize = clamp(gl_PointSize, 1.0, 48.0);
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
// New uniform for audio-reactive rim
uniform float uAudioReactive;

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
  
  // Audio-reactive rim boost - stronger during speaking state
  float audioRimBoost = uAudioReactive > 0.5 
    ? uAudioLevel * 1.2   // Strong audio-driven rim pulse
    : uAudioLevel * 0.3;  // Subtle audio influence
  rim *= (1.0 + audioRimBoost);
  
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
