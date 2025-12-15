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
  RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AtlasStatsCard } from './AtlasStatsCard';
import { KnowledgeBankPanel } from './KnowledgeBankPanel';
import { ErrorLogStream } from './ErrorLogStream';
import { ResearchExplorer } from './ResearchExplorer';
import { LearningFlowVisualization } from './LearningFlowVisualization';
import { useAtlasHealth } from '@/hooks/useAtlasHealth';
import { useAtlasKnowledge } from '@/hooks/useAtlasKnowledge';
import { useAtlasResearch } from '@/hooks/useAtlasResearch';

const AtlasHealthDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useAtlasHealth();
  const { knowledge, isLoading: knowledgeLoading } = useAtlasKnowledge();
  const { topics, isLoading: researchLoading, startResearch } = useAtlasResearch();

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
            color={stats?.errorRate > 5 ? 'destructive' : 'accent'}
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
            <div className="flex items-center justify-between mb-4">
              <TabsList className="glass-card">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Overview
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
                className="glass-card"
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
