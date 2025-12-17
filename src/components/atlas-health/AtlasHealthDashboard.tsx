import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Activity, 
  AlertTriangle, 
  BookOpen, 
  Zap, 
  Database,
  Search,
  RefreshCw,
  Bot
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AtlasStatsCard } from './AtlasStatsCard';
import { KnowledgeBankPanel } from './KnowledgeBankPanel';
import { ErrorLogStream } from './ErrorLogStream';
import { ResearchExplorer } from './ResearchExplorer';
import { LearningFlowVisualization } from './LearningFlowVisualization';
import { AgentRunsPanel } from './AgentRunsPanel';
import { ToolCallsPanel } from './ToolCallsPanel';
import { ApprovalsQueuePanel } from './ApprovalsQueuePanel';
import { SchedulesPanel } from './SchedulesPanel';
import { SystemStatusPanel } from './SystemStatusPanel';
import { AgentConfigPanel } from './AgentConfigPanel';
import { LiveRunTimeline } from './LiveRunTimeline';
import { ModelUsageAnalytics } from './ModelUsageAnalytics';
import { useAtlasHealth } from '@/hooks/useAtlasHealth';
import { useAtlasKnowledge } from '@/hooks/useAtlasKnowledge';
import { useAtlasResearch } from '@/hooks/useAtlasResearch';
import { useApprovals } from '@/hooks/useApprovals';

const AtlasHealthDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useAtlasHealth();
  const { knowledge, isLoading: knowledgeLoading } = useAtlasKnowledge();
  const { topics, isLoading: researchLoading, startResearch } = useAtlasResearch();
  const { pendingCount } = useApprovals();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AtlasStatsCard
            title="Knowledge Entries"
            value={stats?.knowledgeCount ?? 0}
            icon={Brain}
            trend={stats?.knowledgeTrend}
            color="primary"
          />
          <AtlasStatsCard
            title="Active Research"
            value={stats?.activeResearch ?? 0}
            icon={Search}
            color="secondary"
          />
          <AtlasStatsCard
            title="Error Rate"
            value={`${stats?.errorRate ?? 0}%`}
            icon={AlertTriangle}
            trend={stats?.errorTrend}
            color={stats?.errorRate && stats.errorRate > 5 ? 'destructive' : 'accent'}
          />
          <AtlasStatsCard
            title="System Health"
            value={`${stats?.healthScore ?? 100}%`}
            icon={Activity}
            color="primary"
          />
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4 overflow-x-auto">
              <TabsList className="glass-card">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="agent" className="flex items-center gap-2 relative">
                  <Bot className="w-4 h-4" />
                  Agent
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-background text-[10px] font-bold rounded-full flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Knowledge Bank
                </TabsTrigger>
                <TabsTrigger value="research" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Research
                </TabsTrigger>
                <TabsTrigger value="errors" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Errors
                </TabsTrigger>
                <TabsTrigger value="learning" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Learning Mode
                </TabsTrigger>
              </TabsList>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchStats()}
                className="glass-card ml-2 flex-shrink-0"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real-time Learning Flow */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Real-time Learning Flow
                  </h3>
                  <LearningFlowVisualization compact />
                </div>

                {/* Recent Knowledge */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-secondary" />
                    Recent Knowledge
                  </h3>
                  <KnowledgeBankPanel compact limit={5} />
                </div>
              </div>

              {/* Error Stream */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-accent" />
                  Recent Errors
                </h3>
                <ErrorLogStream compact limit={5} />
              </div>
            </TabsContent>

            <TabsContent value="agent" className="space-y-6">
              {/* Live Timeline + Model Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LiveRunTimeline />
                <ModelUsageAnalytics />
              </div>

              {/* Agent Config + System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <AgentConfigPanel />
                </div>
                <SystemStatusPanel />
              </div>
              
              {/* Runs + Approvals */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AgentRunsPanel />
                <ApprovalsQueuePanel />
              </div>
              
              {/* Tool Calls + Schedules */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ToolCallsPanel />
                <SchedulesPanel />
              </div>
            </TabsContent>

            <TabsContent value="knowledge">
              <div className="glass-card p-6 rounded-2xl">
                <KnowledgeBankPanel />
              </div>
            </TabsContent>

            <TabsContent value="research">
              <div className="glass-card p-6 rounded-2xl">
                <ResearchExplorer 
                  topics={topics} 
                  isLoading={researchLoading}
                  onStartResearch={startResearch}
                />
              </div>
            </TabsContent>

            <TabsContent value="errors">
              <div className="glass-card p-6 rounded-2xl">
                <ErrorLogStream />
              </div>
            </TabsContent>

            <TabsContent value="learning">
              <div className="glass-card p-6 rounded-2xl">
                <LearningFlowVisualization />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AtlasHealthDashboard;
