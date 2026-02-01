import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Power, 
  PowerOff, 
  Zap, 
  Shield, 
  AlertTriangle,
  TrendingDown,
  Settings2,
  RefreshCw
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAtlasProviderStatus } from '@/hooks/useAtlasProviderStatus';
import { useSpendingAlerts } from '@/hooks/useSpendingAlerts';
import { useHolographicToast } from '@/hooks/useHolographicToast';

type RoutingMode = 'normal' | 'budget_saving' | 'minimal' | 'disabled';

interface LovableAIControlPanelProps {
  compact?: boolean;
}

export function LovableAIControlPanel({ compact = false }: LovableAIControlPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const toast = useHolographicToast();
  
  const {
    settings,
    updateSettings,
    isUpdating,
  } = useAtlasProviderStatus();
  
  const {
    dailySpending,
    dailyBudgetUsedPct,
    budgetSettings,
    isApproachingDailyLimit,
    isDailyLimitExceeded,
  } = useSpendingAlerts();

  // Calculate current routing mode based on settings and spending
  const calculateRoutingMode = (): RoutingMode => {
    if (!settings?.lovable_ai_enabled) return 'disabled';
    if (!settings?.auto_switch_enabled) return 'normal';
    if (dailyBudgetUsedPct >= 100) return 'disabled';
    if (dailyBudgetUsedPct >= 90) return 'minimal';
    if (dailyBudgetUsedPct >= (settings?.budget_switch_threshold_pct || 70)) return 'budget_saving';
    return 'normal';
  };

  const routingMode = calculateRoutingMode();
  const lovableAIEnabled = settings?.lovable_ai_enabled ?? true;
  const autoSwitchEnabled = settings?.auto_switch_enabled ?? true;
  const budgetSwitchThreshold = settings?.budget_switch_threshold_pct ?? 70;

  const handleToggleLovableAI = async (enabled: boolean) => {
    if (enabled) {
      updateSettings({ 
        lovable_ai_enabled: true,
        disable_reason: null,
        disabled_at: null,
      });
      toast.success({ title: 'Lovable AI enabled', description: 'All AI operations will resume' });
    } else {
      updateSettings({ 
        lovable_ai_enabled: false,
        disable_reason: 'manual',
        disabled_at: new Date().toISOString(),
      });
      toast.warning({ title: 'Lovable AI disabled', description: 'All AI credit usage stopped' });
    }
  };

  const handleToggleAutoSwitch = (enabled: boolean) => {
    updateSettings({ auto_switch_enabled: enabled });
  };

  const handleThresholdChange = (value: number[]) => {
    updateSettings({ budget_switch_threshold_pct: value[0] });
  };

  const getRoutingModeColor = () => {
    switch (routingMode) {
      case 'normal': return 'text-green-500';
      case 'budget_saving': return 'text-yellow-500';
      case 'minimal': return 'text-orange-500';
      case 'disabled': return 'text-red-500';
    }
  };

  const getRoutingModeLabel = () => {
    switch (routingMode) {
      case 'normal': return 'Normal Operation';
      case 'budget_saving': return 'Budget Saving (cheaper models)';
      case 'minimal': return 'Minimal (essential only)';
      case 'disabled': return 'Disabled (no AI calls)';
    }
  };

  if (compact) {
    return (
      <motion.div
        className={`flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm ${
          lovableAIEnabled 
            ? 'bg-primary/10 border-primary/30' 
            : 'bg-destructive/10 border-destructive/30'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={`p-2 rounded-lg ${lovableAIEnabled ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
          {lovableAIEnabled ? <Zap className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Lovable AI</p>
          <p className={`text-xs ${getRoutingModeColor()}`}>
            {getRoutingModeLabel()}
          </p>
        </div>
        <Switch
          checked={lovableAIEnabled}
          onCheckedChange={handleToggleLovableAI}
          disabled={isUpdating}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            lovableAIEnabled 
              ? 'bg-primary/20 text-primary' 
              : 'bg-destructive/20 text-destructive'
          }`}>
            {lovableAIEnabled ? <Zap className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Lovable AI Control</h3>
            <p className="text-sm text-muted-foreground">
              Master switch for all AI operations
            </p>
          </div>
        </div>
        {isDailyLimitExceeded && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Budget Exceeded
          </Badge>
        )}
      </div>

      {/* Main Toggle */}
      <div className={`p-4 rounded-xl border-2 mb-6 ${
        lovableAIEnabled 
          ? 'bg-primary/5 border-primary/30' 
          : 'bg-destructive/5 border-destructive/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Power className={`w-5 h-5 ${lovableAIEnabled ? 'text-primary' : 'text-destructive'}`} />
            <div>
              <p className="font-semibold">Lovable AI</p>
              <p className="text-sm text-muted-foreground">
                {lovableAIEnabled 
                  ? 'All AI features active' 
                  : 'All AI credit usage stopped'}
              </p>
            </div>
          </div>
          <Switch
            checked={lovableAIEnabled}
            onCheckedChange={handleToggleLovableAI}
            disabled={isUpdating}
            className="scale-125"
          />
        </div>
        
        <AnimatePresence>
          {!lovableAIEnabled && settings?.disable_reason && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-xs text-muted-foreground"
            >
              Disabled: {settings.disable_reason === 'manual' ? 'Manually disabled' : settings.disable_reason}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Today's Usage</p>
          <p className="text-lg font-semibold">${dailySpending.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            of ${budgetSettings?.daily_budget_usd?.toFixed(2) || '5.00'} ({dailyBudgetUsedPct.toFixed(0)}%)
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Routing Mode</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              routingMode === 'normal' ? 'bg-green-500' :
              routingMode === 'budget_saving' ? 'bg-yellow-500' :
              routingMode === 'minimal' ? 'bg-orange-500' :
              'bg-red-500'
            }`} />
            <p className={`text-sm font-medium ${getRoutingModeColor()}`}>
              {routingMode === 'normal' ? 'Normal' :
               routingMode === 'budget_saving' ? 'Budget Saving' :
               routingMode === 'minimal' ? 'Minimal' :
               'Disabled'}
            </p>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Auto Budget Protection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <Label className="font-medium">Auto Budget Protection</Label>
          </div>
          <Switch
            checked={autoSwitchEnabled}
            onCheckedChange={handleToggleAutoSwitch}
            disabled={isUpdating || !lovableAIEnabled}
          />
        </div>

        <AnimatePresence>
          {autoSwitchEnabled && lovableAIEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Switch to cheaper models at
                  </span>
                  <span className="font-medium">{budgetSwitchThreshold}%</span>
                </div>
                <Slider
                  value={[budgetSwitchThreshold]}
                  min={50}
                  max={95}
                  step={5}
                  disabled={isUpdating}
                  onValueCommit={handleThresholdChange}
                  className="w-full"
                />
              </div>

              {/* Routing Mode Indicators */}
              <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Current Mode</p>
                {['normal', 'budget_saving', 'minimal', 'disabled'].map((mode) => (
                  <div 
                    key={mode}
                    className={`flex items-center gap-2 text-sm ${
                      routingMode === mode ? 'font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      routingMode === mode 
                        ? mode === 'normal' ? 'bg-green-500' :
                          mode === 'budget_saving' ? 'bg-yellow-500' :
                          mode === 'minimal' ? 'bg-orange-500' :
                          'bg-red-500'
                        : 'bg-muted-foreground/30'
                    }`} />
                    <span>
                      {mode === 'normal' ? 'Normal Operation' :
                       mode === 'budget_saving' ? 'Budget Saving (cheaper models)' :
                       mode === 'minimal' ? 'Minimal (essential only)' :
                       'Disabled (no AI calls)'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="mt-4 pt-4 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2 text-muted-foreground"
        >
          <Settings2 className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </Button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4 overflow-hidden"
            >
              <div className="p-3 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Preferred Cheap Provider</p>
                    <p className="text-xs text-muted-foreground">
                      Used when budget saving is active
                    </p>
                  </div>
                  <Badge variant="outline">
                    {settings?.preferred_cheap_provider || 'lovable_ai'}
                  </Badge>
                </div>

                {settings?.disabled_at && (
                  <div className="text-xs text-muted-foreground">
                    <p>Last disabled: {new Date(settings.disabled_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Emergency Actions */}
              <div className="flex gap-2">
                {!lovableAIEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleLovableAI(true)}
                    disabled={isUpdating}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-enable AI
                  </Button>
                )}
                {lovableAIEnabled && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleToggleLovableAI(false)}
                    disabled={isUpdating}
                    className="gap-2"
                  >
                    <PowerOff className="w-4 h-4" />
                    Emergency Stop
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
