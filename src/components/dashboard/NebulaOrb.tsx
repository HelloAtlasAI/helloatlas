import { Suspense, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { MorphingSphereNebula } from '@/components/aria/scenes/MorphingSphereNebula';
import { AIState } from '@/components/aria/AIOrb';

interface NebulaOrbProps {
  state: AIState;
  audioLevel: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onClick?: () => void;
  className?: string;
  showTrails?: boolean;
}

const sizeClasses = {
  sm: 'w-32 h-32',
  md: 'w-48 h-48',
  lg: 'w-64 h-64',
  xl: 'w-80 h-80',
  full: 'w-full h-full',
};

const NebulaOrbComponent = ({ 
  state, 
  audioLevel, 
  size = 'lg',
  onClick,
  className = '',
  showTrails = false,
}: NebulaOrbProps) => {
  return (
    <div 
      className={`${sizeClasses[size]} ${className} cursor-pointer relative`}
      onClick={onClick}
    >
      {/* Ambient glow - BLUE */}
      <div 
        className="absolute inset-0 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(210 80% 40% / 0.4) 0%, hsl(220 70% 25% / 0.2) 40%, transparent 70%)',
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[5, 5, 5]} intensity={0.3} color="#4488ff" />
          <MorphingSphereNebula 
            state={state} 
            audioLevel={audioLevel}
            particleDensity={60}
            trailLength={showTrails ? 3 : 0}
            morphIntensity={40}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export const NebulaOrb = memo(NebulaOrbComponent);
