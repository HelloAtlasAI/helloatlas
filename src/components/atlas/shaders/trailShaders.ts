// Trail shaders - optimized for GPU-based trail rendering

export const trailVertexShader = `
  attribute float trailIndex;
  attribute float opacity;
  attribute float randomSize;
  varying float vOpacity;
  varying float vTrailIndex;
  varying float vGlow;
  
  void main() {
    vOpacity = opacity;
    vTrailIndex = trailIndex;
    vGlow = 1.0 - trailIndex;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float baseSize = 0.12 * (1.0 - trailIndex * 0.4);
    float sizeVariation = 0.8 + randomSize * 0.4;
    gl_PointSize = baseSize * sizeVariation * (350.0 / -mvPosition.z);
  }
`;

export const trailFragmentShader = `
  uniform vec3 uColorStart;
  uniform vec3 uColorEnd;
  uniform float uBaseOpacity;
  uniform float uEnableGradient;
  varying float vOpacity;
  varying float vTrailIndex;
  varying float vGlow;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float coreFalloff = 1.0 - smoothstep(0.0, 0.25, dist);
    float outerFalloff = 1.0 - smoothstep(0.15, 0.5, dist);
    float intensity = mix(outerFalloff, coreFalloff, vGlow * 0.5);
    
    vec3 baseColor = mix(uColorStart, uColorEnd, vTrailIndex * uEnableGradient);
    vec3 glowColor = baseColor + vec3(0.15, 0.1, 0.05) * vGlow;
    
    float trailFade = pow(vOpacity, 0.7);
    float alpha = intensity * trailFade * uBaseOpacity * 0.85;
    
    gl_FragColor = vec4(glowColor, alpha);
  }
`;
