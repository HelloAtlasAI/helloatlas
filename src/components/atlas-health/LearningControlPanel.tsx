import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Power, 
  Settings2, 
  Brain, 
  Layers, 
  Sparkles,
  AlertTriangle,
  CreditCard,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAtlasProviderStatus } from '@/hooks/useAtlasProviderStatus';
import { useAtlasLearningControl } from '@/hooks/useAtlasLearningControl';

interface LearningControlPanelProps {
  compact?: boolean;
}

export function LearningControlPanel({ compact = false }: LearningControlPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    settings,
    learningEnabled,
    isSystemHealthy,
    hasCreditsIssue,
    hasRateLimitIssue,
    isToggling,
  } = useAtlasProviderStatus();

  const {
    enableLearning,
    disableLearning,
    setMaxTopics,
    setMaxDepth,
    setLearningMode,
    canLearn,
  } = useAtlasLearningControl();

  const handleToggle = () => {
    if (learningEnabled) {
      disableLearning();
    } else {
      enableLearning();
    }
  };

  if (compact) {
    return (
      <motion.div
        className={`flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm ${
          learningEnabled 
            ? 'bg-primary/10 border-primary/30' 
            : 'bg-muted/20 border-border/30'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={`p-2 rounded-lg ${learningEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <Brain className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Learning</p>
          <p className="text-xs text-muted-foreground">
            {learningEnabled ? 'Active - on demand' : 'Disabled'}
          </p>
        </div>
        <Switch
          checked={learningEnabled}
          onCheckedChange={handleToggle}
          disabled={isToggling || hasCreditsIssue}
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
      {/* Lovable AI Disabled Warning */}
      {!settings?.lovable_ai_enabled && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 mb-4">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              Lovable AI is disabled - Learning is unavailable
            </span>
          </div>
          <p className="text-xs text-red-400/80 mt-1 ml-6">
            Enable Lovable AI in the control panel to resume learning.
          </p>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            learningEnabled 
              ? 'bg-primary/20 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Learning Control</h3>
            <p className="text-sm text-muted-foreground">
              {learningEnabled 
                ? `Mode: ${settings?.learning_mode || 'on_demand'}` 
                : 'Learning is disabled'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasCreditsIssue && (
            <Badge variant="destructive" className="gap-1">
              <CreditCard className="w-3 h-3" />
              Credits Exhausted
            </Badge>
          )}
          {hasRateLimitIssue && !hasCreditsIssue && (
            <Badge variant="outline" className="gap-1 border-orange-500/50 text-orange-500">
              <Clock className="w-3 h-3" />
              Rate Limited
            </Badge>
          )}
          {!isSystemHealthy && !hasCreditsIssue && (
            <Badge variant="outline" className="gap-1 border-yellow-500/50 text-yellow-500">
              <AlertTriangle className="w-3 h-3" />
              System Degraded
            </Badge>
          )}
          <Button
            variant={learningEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggle}
            disabled={isToggling || hasCreditsIssue || !settings?.lovable_ai_enabled}
            className="gap-2"
          >
            <Power className="w-4 h-4" />
            {learningEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>

      {/* Status indicators */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-xl border ${canLearn ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/20 border-border/30'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className={`w-4 h-4 ${canLearn ? 'text-green-500' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">Can Learn</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {canLearn ? 'Ready to learn from conversations' : 'Learning conditions not met'}
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-muted/20 border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Max Topics</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {settings?.max_topics_per_session || 3} per session
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-muted/20 border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Research Depth</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Level {settings?.max_research_depth || 2} max
          </p>
        </div>
      </div>

      {/* Advanced settings */}
      <div className="border-t border-border/30 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2 text-muted-foreground"
        >
          <Settings2 className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </Button>

        {showAdvanced && (
          <motion.div
            className="mt-4 space-y-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {/* Learning Mode */}
            <div className="space-y-2">
              <Label>Learning Mode</Label>
              <Select 
                value={settings?.learning_mode || 'on_demand'}
                onValueChange={(value) => setLearningMode(value as 'on_demand' | 'scheduled' | 'disabled')}
              >
                <SelectTrigger className="w-full bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_demand">On Demand (User-triggered)</SelectItem>
                  <SelectItem value="scheduled">Scheduled (Background)</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                On Demand: Learning only when you explicitly ask. Scheduled: Background learning (uses more credits).
              </p>
            </div>

            {/* Max Topics per Session */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Max Topics per Session</Label>
                <span className="text-sm text-muted-foreground">{settings?.max_topics_per_session || 3}</span>
              </div>
              <Slider
                value={[settings?.max_topics_per_session || 3]}
                onValueChange={(value) => setMaxTopics(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Limits how many topics Atlas learns in a single conversation.
              </p>
            </div>

            {/* Max Research Depth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Max Research Depth</Label>
                <span className="text-sm text-muted-foreground">Level {settings?.max_research_depth || 2}</span>
              </div>
              <Slider
                value={[settings?.max_research_depth || 2]}
                onValueChange={(value) => setMaxDepth(value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How deep Atlas dives into sub-topics. Higher = more thorough but more credits.
              </p>
            </div>

            {/* Auto settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Knowledge Extraction</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically extract knowledge from conversations
                  </p>
                </div>
                <Switch
                  checked={settings?.auto_knowledge_extraction || false}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Validation</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically validate learned facts
                  </p>
                </div>
                <Switch
                  checked={settings?.auto_validation || false}
                  disabled
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
