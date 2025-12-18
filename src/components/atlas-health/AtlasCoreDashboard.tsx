import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Activity, 
  AlertTriangle, 
  BookOpen, 
  Zap, 
  Database,
  Search,
  RefreshCw,
  Bot,
  Sparkles,
  TrendingUp,
  CircuitBoard,
  Settings
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AtlasStatsCard } from './AtlasStatsCard';
import { KnowledgeBankPanel } from './KnowledgeBankPanel';
import { ErrorLogStream } from './ErrorLogStream';
import { ResearchExplorer } from './ResearchExplorer';
import { ResearchQueueVisualization } from './ResearchQueueVisualization';
import { LearningFlowVisualization } from './LearningFlowVisualization';
import { AgentRunsPanel } from './AgentRunsPanel';
import { ToolCallsPanel } from './ToolCallsPanel';
import { ApprovalsQueuePanel } from './ApprovalsQueuePanel';
import { SchedulesPanel } from './SchedulesPanel';
import { SystemStatusPanel } from './SystemStatusPanel';
import { AgentConfigPanel } from './AgentConfigPanel';
import { LiveRunTimeline } from './LiveRunTimeline';
import { ModelUsageAnalytics } from './ModelUsageAnalytics';
import { AtlasSettingsPanel } from './AtlasSettingsPanel';
import { useAtlasHealth } from '@/hooks/useAtlasHealth';
import { useAtlasKnowledge } from '@/hooks/useAtlasKnowledge';
import { useAtlasResearch } from '@/hooks/useAtlasResearch';
import { useApprovals } from '@/hooks/useApprovals';
import { useAtlasNotifications } from '@/hooks/useAtlasNotifications';
import { UnifiedAtlasSphere } from '@/components/atlas/UnifiedAtlasSphere';

const AtlasCoreDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useAtlasHealth();
  const { knowledge, isLoading: knowledgeLoading } = useAtlasKnowledge();
  const { topics, isLoading: researchLoading, startResearch } = useAtlasResearch();
  const { pendingCount } = useApprovals();
  
  // Enable real-time notifications
  useAtlasNotifications({ enabled: true });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const glowVariants = {
    idle: { boxShadow: '0 0 20px hsl(var(--primary) / 0.1)' },
    hover: { boxShadow: '0 0 40px hsl(var(--primary) / 0.25)' }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Sphere */}
      <motion.section 
        className="relative py-8 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Sphere Visualization */}
            <motion.div 
              className="relative w-[200px] h-[200px] flex-shrink-0"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <UnifiedAtlasSphere
                state={stats?.healthScore && stats.healthScore > 90 ? 'passive' : stats?.healthScore && stats.healthScore > 70 ? 'thinking' : 'activated'}
                audioLevel={0.1}
                responsive={false}
                className="w-full h-full"
              />
              {/* Glow ring */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, transparent 40%, hsl(var(--primary) / 0.1) 60%, transparent 70%)',
                }}
              />
            </motion.div>

            {/* Stats Cards */}
            <div className="flex-1 w-full">
              <motion.div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <AtlasStatsCard
                    title="Knowledge"
                    value={stats?.knowledgeCount ?? 0}
                    icon={Brain}
                    trend={stats?.knowledgeTrend}
                    color="primary"
                    className="h-full"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <AtlasStatsCard
                    title="Research"
                    value={stats?.activeResearch ?? 0}
                    icon={Search}
                    color="secondary"
                    className="h-full"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <AtlasStatsCard
                    title="Error Rate"
                    value={`${stats?.errorRate ?? 0}%`}
                    icon={AlertTriangle}
                    trend={stats?.errorTrend}
                    color={stats?.errorRate && stats.errorRate > 5 ? 'destructive' : 'accent'}
                    className="h-full"
                  />
                </motion.div>
                <motion.div variants={itemVariants}>
                  <AtlasStatsCard
                    title="Health"
                    value={`${stats?.healthScore ?? 100}%`}
                    icon={Activity}
                    color="primary"
                    className="h-full"
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <motion.section 
        className="container mx-auto px-4 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Navigation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="backdrop-blur-xl bg-background/40 border border-border/30 p-1 rounded-2xl overflow-x-auto flex-shrink-0">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="agent" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary relative"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Agent</span>
                {pendingCount > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-background text-[10px] font-bold rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    {pendingCount}
                  </motion.span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="knowledge" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"
              >
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Knowledge</span>
              </TabsTrigger>
              <TabsTrigger 
                value="research" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Research</span>
              </TabsTrigger>
              <TabsTrigger 
                value="learning" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Learning</span>
              </TabsTrigger>
              <TabsTrigger 
                value="errors" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Errors</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSettings(!showSettings)}
                className={`backdrop-blur-xl bg-background/40 border-border/30 hover:bg-primary/10 hover:border-primary/50 transition-all ${showSettings ? 'bg-primary/20 border-primary/50' : ''}`}
              >
                <Settings className={`w-4 h-4 mr-2 ${showSettings ? 'animate-spin' : ''}`} />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="backdrop-blur-xl bg-background/40 border-border/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <AtlasSettingsPanel onClose={() => setShowSettings(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <TabsContent value="overview" className="space-y-6 mt-0">
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Real-time Learning Flow */}
                <motion.div 
                  variants={itemVariants}
                  whileHover="hover"
                  className="backdrop-blur-xl bg-background/30 border border-border/30 p-6 rounded-2xl hover:border-primary/30 transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Real-time Data Flow
                  </h3>
                  <LearningFlowVisualization compact />
                </motion.div>

                {/* Recent Knowledge */}
                <motion.div 
                  variants={itemVariants}
                  className="backdrop-blur-xl bg-background/30 border border-border/30 p-6 rounded-2xl hover:border-secondary/30 transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-secondary" />
                    Recent Knowledge
                  </h3>
                  <KnowledgeBankPanel compact limit={5} />
                </motion.div>
              </motion.div>

              {/* Research Queue + Error Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="backdrop-blur-xl bg-background/30 border border-border/30 p-6 rounded-2xl hover:border-cyan-500/30 transition-colors"
                >
                  <ResearchQueueVisualization topics={topics} compact />
                </motion.div>

                <motion.div 
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="backdrop-blur-xl bg-background/30 border border-border/30 p-6 rounded-2xl hover:border-accent/30 transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-accent" />
                    Recent Errors
                  </h3>
                  <ErrorLogStream compact limit={5} />
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="agent" className="space-y-6 mt-0">
              {/* Live Timeline + Model Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <LiveRunTimeline />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <ModelUsageAnalytics />
                </motion.div>
              </div>

              {/* Agent Config + System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div 
                  className="lg:col-span-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <AgentConfigPanel />
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <SystemStatusPanel />
                </motion.div>
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

            <TabsContent value="knowledge" className="mt-0">
              <motion.div 
                className="backdrop-blur-xl bg-background/30 border border-border/30 p-6 rounded-2xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <KnowledgeBankPanel />
              </motion.div>
            </TabsContent>

            <TabsContent value="research" className="space-y-6 mt-0">
              {/* Queue Visualization */}
              <motion.div 
                className="backdrop-blur-xl bg-background/30 border border-border/30 p-6 rounded-2xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ResearchQueueVisualization topics={topics} />
              </motion.div>

              {/* Research Explorer */}
              <motion.div 
                className="backdrop-blur-xl bg-background/30 border border-border/30 p-6 rounded-2xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <ResearchExplorer 
                  topics={topics} 
                  isLoading={researchLoading}
                  onStartResearch={startResearch}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="learning" className="mt-0">
              <motion.div 
                className="backdrop-blur-xl bg-background/30 border border-border/30 p-6 rounded-2xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <LearningFlowVisualization />
              </motion.div>
            </TabsContent>

            <TabsContent value="errors" className="mt-0">
              <motion.div 
                className="backdrop-blur-xl bg-background/30 border border-border/30 p-6 rounded-2xl"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ErrorLogStream />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.section>
    </div>
  );
};

export default AtlasCoreDashboard;
