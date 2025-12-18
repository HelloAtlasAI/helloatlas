import { memo, useState, useEffect, useCallback } from 'react';
import { AtlasSphere } from '@/components/atlas';
import { Mic } from 'lucide-react';
import type { WakeWordState } from '@/types';

interface AtlasInterfaceProps {
  state: WakeWordState;
  audioLevel: number;
  userName?: string;
  transcript?: string;
  lastMessage?: string;
  lastResponse?: string;
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
      
      {/* Enable Voice Prompt */}
      {!voiceEnabled && (
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 flex items-center gap-2 px-3 py-1.5 bg-primary/10 backdrop-blur-sm rounded-full border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
          onClick={onEnableVoice}
        >
          <Mic className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">Click to enable voice</span>
        </div>
      )}
    </div>
  );
};

export const AtlasInterface = memo(AtlasInterfaceComponent);
