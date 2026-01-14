import { AlertTriangle, X, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSpendingAlerts } from "@/hooks/useSpendingAlerts";

interface SpendingAlertBannerProps {
  onOpenSettings?: () => void;
}

export function SpendingAlertBanner({ onOpenSettings }: SpendingAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const {
    budgetSettings,
    dailySpending,
    dailyBudgetUsedPct,
    isApproachingDailyLimit,
    isDailyCritical,
    isDailyLimitExceeded,
    isLoading,
  } = useSpendingAlerts();

  // Don't show if loading, dismissed, or no alert needed
  if (isLoading || dismissed || !budgetSettings?.alerts_enabled) return null;
  if (!isApproachingDailyLimit && !isDailyCritical && !isDailyLimitExceeded) return null;

  const getAlertState = () => {
    if (isDailyLimitExceeded) {
      return {
        title: "Daily Budget Exceeded",
        description: "Learning has been paused to protect your budget. Adjust limits or wait until tomorrow.",
        bgClass: "bg-destructive/10 border-destructive/30",
        iconClass: "text-destructive",
        progressClass: "bg-destructive",
      };
    }
    if (isDailyCritical) {
      return {
        title: "Daily Budget Critical",
        description: "Learning will be disabled at 100% to protect your budget.",
        bgClass: "bg-orange-500/10 border-orange-500/30",
        iconClass: "text-orange-500",
        progressClass: "bg-orange-500",
      };
    }
    return {
      title: "Daily Budget Alert",
      description: "Consider adjusting your settings to stay within budget.",
      bgClass: "bg-yellow-500/10 border-yellow-500/30",
      iconClass: "text-yellow-500",
      progressClass: "bg-yellow-500",
    };
  };

  const alertState = getAlertState();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`rounded-lg border p-4 mb-4 ${alertState.bgClass}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className={`h-5 w-5 mt-0.5 ${alertState.iconClass}`} />
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="font-medium text-foreground">{alertState.title}</h4>
                <p className="text-sm text-muted-foreground">{alertState.description}</p>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${dailySpending.toFixed(2)} of ${budgetSettings?.daily_budget_usd.toFixed(2)}
                  </span>
                  <span className={alertState.iconClass}>
                    {Math.min(dailyBudgetUsedPct, 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(dailyBudgetUsedPct, 100)} 
                  className="h-2"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenSettings}
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings2 className="h-4 w-4 mr-1" />
                Adjust
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
