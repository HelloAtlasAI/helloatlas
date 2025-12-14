import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { MorphingSphereNebula } from '@/components/aria/scenes/MorphingSphereNebula';
import { AIState } from '@/components/aria/AIOrb';

interface NebulaOrbProps {
  state: AIState;
  audioLevel: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-32 h-32',
  md: 'w-48 h-48',
  lg: 'w-64 h-64',
  xl: 'w-80 h-80',
  full: 'w-full h-full',
};

export const NebulaOrb = ({ 
  state, 
  audioLevel, 
  size = 'lg',
  onClick,
  className = '' 
}: NebulaOrbProps) => {
  return (
    <div 
      className={`${sizeClasses[size]} ${className} cursor-pointer relative`}
      onClick={onClick}
    >
      {/* Ambient glow */}
      <div 
        className="absolute inset-0 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(var(--orb-core) / 0.5) 0%, hsl(var(--orb-inner) / 0.3) 40%, transparent 70%)',
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={0.5} />
          <MorphingSphereNebula 
            state={state} 
            audioLevel={audioLevel}
            particleDensity={75}
            trailLength={6}
            morphIntensity={50}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
