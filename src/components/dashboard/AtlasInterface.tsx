import { memo, useState, useEffect, useCallback } from 'react';
import { ScaledAtlasSphere } from '@/components/atlas/ScaledAtlasSphere';
import { WakeWordState } from '@/hooks/useWakeWordFixed';

interface AtlasInterfaceProps {
  state: WakeWordState;
  audioLevel: number;
  userName?: string;
  transcript?: string;
  lastMessage?: string;
  lastResponse?: string;
  isSupported?: boolean;
  onManualActivate?: () => void;
}

const AtlasInterfaceComponent = ({
  state,
  audioLevel,
  isSupported = true,
  onManualActivate,
}: AtlasInterfaceProps) => {
  const [showHint, setShowHint] = useState(true);

  // Hide hint after first activation
  useEffect(() => {
    if (state === 'activated' || state === 'listening') {
      setShowHint(false);
    }
  }, [state]);

  const canActivate = state === 'dormant' || state === 'passive';

  const handleClick = useCallback(() => {
    if (canActivate && onManualActivate) {
      onManualActivate();
    }
  }, [canActivate, onManualActivate]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Atlas Core Sphere - no parent scale transforms to avoid measurement issues */}
      <div 
        className={`relative flex-shrink-0 w-[140px] h-[140px] z-10 ${canActivate ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        <ScaledAtlasSphere 
          state={state}
          audioLevel={audioLevel}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export const AtlasInterface = memo(AtlasInterfaceComponent);
