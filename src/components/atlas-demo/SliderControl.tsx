import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  color?: string;
  decimals?: number;
  hint?: [string, string];
  suffix?: string;
}

export function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  color = 'violet',
  decimals = 0,
  hint,
  suffix = '',
}: SliderControlProps) {
  const colorClasses: Record<string, string> = {
    violet: 'text-violet-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    rose: 'text-rose-400',
    sky: 'text-sky-400',
    pink: 'text-pink-400',
    indigo: 'text-indigo-400',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn('text-xs font-mono', colorClasses[color] || colorClasses.violet)}>
          {value.toFixed(decimals)}{suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {hint && (
        <div className="flex justify-between text-[10px] text-muted-foreground/60">
          <span>{hint[0]}</span>
          <span>{hint[1]}</span>
        </div>
      )}
    </div>
  );
}
