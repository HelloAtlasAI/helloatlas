import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { useApprovals } from '@/hooks/useApprovals';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

export function ApprovalsQueuePanel() {
  const { approvals, pendingCount, isLoading, approveRequest, rejectRequest, getRiskColor } = useApprovals();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveRequest(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    setProcessingId(selectedApproval);
    try {
      await rejectRequest(selectedApproval, 'Rejected by user');
    } finally {
      setProcessingId(null);
      setRejectDialogOpen(false);
      setSelectedApproval(null);
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-yellow-400/10">
            <ShieldCheck className="w-5 h-5 text-yellow-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Approvals Queue</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-400/10">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Approvals Queue</h3>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
              {pendingCount} pending
            </Badge>
          )}
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="w-10 h-10 text-green-400/50 mb-2" />
            <p className="text-sm text-muted-foreground">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-yellow-400/10 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {approval.action_summary}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 h-4 ${getRiskColor(approval.risk_level || 'medium')}`}
                      >
                        {approval.risk_level} risk
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      onClick={() => handleApprove(approval.id)}
                      disabled={processingId === approval.id}
                    >
                      {processingId === approval.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() => {
                        setSelectedApproval(approval.id);
                        setRejectDialogOpen(true);
                      }}
                      disabled={processingId === approval.id}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Approval Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this action? The tool will not be executed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleReject}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
