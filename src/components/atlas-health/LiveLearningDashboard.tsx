import { motion } from 'framer-motion';
import { useAtlasLearning } from '@/hooks/useAtlasLearning';
import { BrainActivityPanel } from './BrainActivityPanel';
import { LiveCollectionStream } from './LiveCollectionStream';
import { ValidationPipelinePanel } from './ValidationPipelinePanel';
import { LearningVelocityMetrics } from './LearningVelocityMetrics';
import { toast } from 'sonner';

export function LiveLearningDashboard() {
  const {
    brainRuns,
    activeRun,
    lastRun,
    isRunning,
    researchQueue,
    queuedCount,
    processingCount,
    validationLogs,
    learningMetrics,
    triggerBrainCycle,
    isTriggering,
    isLoading
  } = useAtlasLearning();

  const handleTrigger = async () => {
    try {
      await triggerBrainCycle();
      toast.success('Brain cycle triggered', {
        description: 'Atlas is now collecting and processing knowledge'
      });
    } catch (error) {
      toast.error('Failed to trigger brain cycle', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Learning Velocity Metrics - Top Bar */}
      <motion.div variants={itemVariants}>
        <LearningVelocityMetrics
          metrics={learningMetrics}
          queuedCount={queuedCount}
          processingCount={processingCount}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Brain Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <BrainActivityPanel
            activeRun={activeRun}
            lastRun={lastRun}
            isRunning={isRunning}
            isTriggering={isTriggering}
            onTrigger={handleTrigger}
          />
        </motion.div>

        {/* Middle Column - Collection Stream */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <LiveCollectionStream
            items={researchQueue}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Right Column - Validation Pipeline */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <ValidationPipelinePanel
            validations={validationLogs}
            successRate={learningMetrics.successRate}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
