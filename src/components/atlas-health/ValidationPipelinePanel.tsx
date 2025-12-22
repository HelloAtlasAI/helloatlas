import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, AlertTriangle, XCircle, Clock, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface ValidationLog {
  id: string;
  entry_id: string;
  entry_type: string;
  verdict: string;
  confidence: number;
  validator_model: string;
  reasoning: string | null;
  processing_time_ms: number | null;
  created_at: string;
}

interface ValidationPipelinePanelProps {
  validations: ValidationLog[];
  successRate: number;
}

export function ValidationPipelinePanel({ validations, successRate }: ValidationPipelinePanelProps) {
  const getVerdictIcon = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'valid':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'fake':
      case 'invalid':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'valid':
        return 'border-emerald-500/30 bg-emerald-500/10';
      case 'suspicious':
        return 'border-amber-500/30 bg-amber-500/10';
      case 'fake':
      case 'invalid':
        return 'border-destructive/30 bg-destructive/10';
      default:
        return 'border-border/30 bg-background/30';
    }
  };

  const getModelBadge = (model: string) => {
    if (model.includes('gemini')) return { icon: '✨', color: 'text-cyan-400' };
    if (model.includes('claude')) return { icon: '🎭', color: 'text-violet-400' };
    if (model.includes('perplexity')) return { icon: '🔮', color: 'text-primary' };
    return { icon: '🤖', color: 'text-muted-foreground' };
  };

  // Calculate verdict distribution
  const verdictCounts = validations.reduce((acc, v) => {
    const key = v.verdict.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = validations.length || 1;
  const validPercent = Math.round(((verdictCounts['valid'] || 0) / total) * 100);
  const suspiciousPercent = Math.round(((verdictCounts['suspicious'] || 0) / total) * 100);
  const fakePercent = Math.round((((verdictCounts['fake'] || 0) + (verdictCounts['invalid'] || 0)) / total) * 100);

  return (
    <div className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Validation Pipeline</h3>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{successRate}% valid</span>
        </div>
      </div>

      {/* Verdict Distribution Bar */}
      <div className="mb-4 p-3 bg-background/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Valid ({validPercent}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Suspicious ({suspiciousPercent}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span>Invalid ({fakePercent}%)</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-background/30 overflow-hidden flex">
          <motion.div
            className="h-full bg-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${validPercent}%` }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="h-full bg-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${suspiciousPercent}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          <motion.div
            className="h-full bg-destructive"
            initial={{ width: 0 }}
            animate={{ width: `${fakePercent}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Validation Stream */}
      <ScrollArea className="h-[280px] pr-2">
        <AnimatePresence mode="popLayout">
          {validations.slice(0, 15).map((validation, index) => {
            const modelBadge = getModelBadge(validation.validator_model);
            
            return (
              <motion.div
                key={validation.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={`mb-2 p-3 rounded-xl border ${getVerdictColor(validation.verdict)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getVerdictIcon(validation.verdict)}
                    <span className="font-medium capitalize text-sm">{validation.verdict}</span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(validation.confidence * 100)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className={modelBadge.color}>{modelBadge.icon}</span>
                    <span className="text-muted-foreground truncate max-w-[80px]">
                      {validation.validator_model.split('/').pop()}
                    </span>
                  </div>
                </div>

                {/* Confidence Bar */}
                <Progress 
                  value={validation.confidence * 100} 
                  className="h-1 mb-2"
                />

                {validation.reasoning && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {validation.reasoning}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span className="capitalize">{validation.entry_type}</span>
                  <div className="flex items-center gap-2">
                    {validation.processing_time_ms && (
                      <span>{validation.processing_time_ms}ms</span>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(validation.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {validations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Shield className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No validations yet</p>
            <p className="text-xs mt-1">Validations appear as knowledge is verified</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
