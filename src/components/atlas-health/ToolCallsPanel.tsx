import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useToolCalls } from '@/hooks/useToolCalls';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function ToolCallsPanel() {
  const { toolCalls, isLoading, getStatusColor } = useToolCalls(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Wrench className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Tool Calls</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Wrench className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Tool Calls</h3>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          {toolCalls.length} calls
        </Badge>
      </div>

      {toolCalls.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No tool calls yet</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
          {toolCalls.map((tc) => (
            <div key={tc.id} className="rounded-lg bg-muted/30 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                onClick={() => setExpandedId(expandedId === tc.id ? null : tc.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {tc.tool_name}
                    </span>
                    <span className={`text-xs ${getStatusColor(tc.status)}`}>
                      {tc.status}
                    </span>
                    {tc.requires_approval && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-400/10 text-yellow-400 border-yellow-400/30">
                        approval
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{formatDistanceToNow(new Date(tc.created_at), { addSuffix: true })}</span>
                    <span>•</span>
                    <span className="text-green-400">${tc.cost_estimate?.toFixed(4) || '0.00'}</span>
                  </div>
                </div>
                
                {expandedId === tc.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {expandedId === tc.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Arguments:</p>
                        <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto max-h-24">
                          {JSON.stringify(tc.args_json, null, 2)}
                        </pre>
                      </div>
                      {tc.result_json && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Result:</p>
                          <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto max-h-24">
                            {JSON.stringify(tc.result_json, null, 2)}
                          </pre>
                        </div>
                      )}
                      {tc.error_message && (
                        <div>
                          <p className="text-xs text-red-400 mb-1">Error:</p>
                          <p className="text-xs text-red-400/80 bg-red-400/10 p-2 rounded">
                            {tc.error_message}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
