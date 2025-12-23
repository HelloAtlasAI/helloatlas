import { memo, useState, useEffect, useCallback } from 'react';
import { AtlasSphere } from '@/components/atlas';
import type { WakeWordState } from '@/types';

interface AtlasInterfaceProps {
  state: WakeWordState;
  audioLevel: number;
  isSupported?: boolean;
  voiceEnabled?: boolean;
  onManualActivate?: () => void;
  onEnableVoice?: () => void;
}

const AtlasInterfaceComponent = ({
  state,
  audioLevel,
  isSupported = true,
  voiceEnabled = false,
  onManualActivate,
  onEnableVoice,
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
    if (!voiceEnabled && onEnableVoice) {
      // First click enables voice
      onEnableVoice();
    } else if (canActivate && onManualActivate) {
      onManualActivate();
    }
  }, [voiceEnabled, canActivate, onManualActivate, onEnableVoice]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Atlas Core Sphere - no parent scale transforms to avoid measurement issues */}
      <div 
        className={`relative flex-shrink-0 w-[140px] h-[140px] z-10 ${canActivate || !voiceEnabled ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        <AtlasSphere 
          state={state}
          audioLevel={audioLevel}
          context="dashboard"
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export const AtlasInterface = memo(AtlasInterfaceComponent);
