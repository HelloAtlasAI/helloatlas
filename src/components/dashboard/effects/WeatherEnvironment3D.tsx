import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { RainParticles } from './RainParticles';
import { SnowParticles } from './SnowParticles';
import { CloudSystem } from './CloudSystem';
import { LightningFlash } from './LightningFlash';

interface WeatherEnvironment3DProps {
  condition: string;
  intensity?: number;
  className?: string;
}

const getWeatherConfig = (condition: string) => {
  const lower = condition.toLowerCase();
  
  if (lower.includes('thunder') || lower.includes('storm')) {
    return { rain: true, snow: false, clouds: true, lightning: true, cloudDarkness: 0.7 };
  }
  if (lower.includes('heavy rain')) {
    return { rain: true, snow: false, clouds: true, lightning: false, cloudDarkness: 0.5, rainIntensity: 1.5 };
  }
  if (lower.includes('rain') || lower.includes('drizzle')) {
    return { rain: true, snow: false, clouds: true, lightning: false, cloudDarkness: 0.4 };
  }
  if (lower.includes('snow') || lower.includes('sleet')) {
    return { rain: false, snow: true, clouds: true, lightning: false, cloudDarkness: 0.2 };
  }
  if (lower.includes('cloud') || lower.includes('overcast')) {
    return { rain: false, snow: false, clouds: true, lightning: false, cloudDarkness: 0.3 };
  }
  
  // Clear/sunny
  return { rain: false, snow: false, clouds: false, lightning: false, cloudDarkness: 0 };
};

const WeatherScene = ({ condition, intensity = 1 }: { condition: string; intensity?: number }) => {
  const config = useMemo(() => getWeatherConfig(condition), [condition]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {config.clouds && (
        <CloudSystem 
          count={12} 
          coverage={0.7} 
          speed={0.2} 
          darkness={config.cloudDarkness} 
        />
      )}
      
      {config.rain && (
        <RainParticles 
          count={config.rainIntensity ? 3000 : 2000}
          intensity={config.rainIntensity || intensity}
          speed={0.6}
        />
      )}
      
      {config.snow && (
        <SnowParticles 
          count={800}
          intensity={intensity}
          speed={0.25}
        />
      )}
      
      {config.lightning && (
        <LightningFlash 
          intensity={intensity}
          frequency={0.03}
          enabled={true}
        />
      )}
    </>
  );
};

export const WeatherEnvironment3D = ({
  condition,
  intensity = 1,
  className = '',
}: WeatherEnvironment3DProps) => {
  const config = getWeatherConfig(condition);
  
  // Only render 3D canvas if there are weather effects to show
  if (!config.rain && !config.snow && !config.clouds) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <WeatherScene condition={condition} intensity={intensity} />
        </Suspense>
      </Canvas>
    </div>
  );
};
