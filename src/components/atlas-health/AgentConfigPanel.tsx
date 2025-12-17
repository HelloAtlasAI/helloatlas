import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Plus, Settings, Trash2, ToggleLeft, ToggleRight, 
  Loader2, ChevronDown, ChevronUp, Zap, Shield, Brain
} from 'lucide-react';
import { useAgents, AgentFormData } from '@/hooks/useAgents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MODEL_OPTIONS = [
  { value: 'openai/gpt-5', label: 'GPT-5 (Powerful)', tier: 'planner' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini (Balanced)', tier: 'worker' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano (Fast)', tier: 'worker' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'planner' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast)', tier: 'worker' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', tier: 'worker' },
];

export function AgentConfigPanel() {
  const { 
    agents, isLoading, createAgent, updateAgent, deleteAgent, toggleAgent,
    availableTools, defaultModels, defaultRiskyTools 
  } = useAgents();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    description: '',
    system_prompt: 'You are a helpful AI assistant.',
    model_config_json: defaultModels,
    enabled_tools_json: availableTools.filter(t => !defaultRiskyTools.includes(t)),
    risky_tools_json: defaultRiskyTools,
    max_steps: 20,
    daily_budget_limit: 5,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      system_prompt: 'You are a helpful AI assistant.',
      model_config_json: defaultModels,
      enabled_tools_json: availableTools.filter(t => !defaultRiskyTools.includes(t)),
      risky_tools_json: defaultRiskyTools,
      max_steps: 20,
      daily_budget_limit: 5,
      is_active: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.system_prompt) return;
    
    setIsSubmitting(true);
    try {
      await createAgent(formData);
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating agent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgentId) return;
    
    try {
      await deleteAgent(selectedAgentId);
      setDeleteDialogOpen(false);
      setSelectedAgentId(null);
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const handleToolToggle = (tool: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      enabled_tools_json: checked 
        ? [...(prev.enabled_tools_json || []), tool]
        : (prev.enabled_tools_json || []).filter(t => t !== tool),
    }));
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Agent Configuration</h3>
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
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Agent Configuration</h3>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="bg-primary/20 hover:bg-primary/30 text-primary"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Agent
          </Button>
        </div>

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bot className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No agents configured</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first AI agent to get started</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
            {agents.map((agent) => {
              const isExpanded = expandedId === agent.id;
              
              return (
                <div
                  key={agent.id}
                  className={`rounded-lg border transition-colors ${
                    agent.is_active 
                      ? 'bg-muted/30 border-border/50 hover:bg-muted/50' 
                      : 'bg-muted/10 border-border/30 opacity-60'
                  }`}
                >
                  <button
                    className="w-full p-4 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : agent.id)}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAgent(agent.id, !agent.is_active);
                        }}
                      >
                        {agent.is_active ? (
                          <ToggleRight className="w-6 h-6 text-primary" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{agent.name}</p>
                        {agent.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {agent.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-400/10 text-blue-400 border-blue-400/30">
                            <Zap className="w-2.5 h-2.5 mr-0.5" />
                            {agent.max_steps} steps
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-400/10 text-green-400 border-green-400/30">
                            ${agent.daily_budget_limit}/day
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-purple-400/10 text-purple-400 border-purple-400/30">
                            <Shield className="w-2.5 h-2.5 mr-0.5" />
                            {agent.enabled_tools_json.length} tools
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgentId(agent.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">System Prompt:</p>
                            <p className="text-xs bg-background/50 p-2 rounded max-h-20 overflow-y-auto">
                              {agent.system_prompt}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Brain className="w-3 h-3" /> Planner
                              </p>
                              <p className="text-xs text-foreground">
                                {agent.model_config_json.planner || 'Default'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Worker
                              </p>
                              <p className="text-xs text-foreground">
                                {agent.model_config_json.worker || 'Default'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Reasoner
                              </p>
                              <p className="text-xs text-foreground">
                                {agent.model_config_json.reasoner || 'Default'}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Enabled Tools:</p>
                            <div className="flex flex-wrap gap-1">
                              {agent.enabled_tools_json.map((tool) => (
                                <Badge 
                                  key={tool} 
                                  variant="outline" 
                                  className={`text-[10px] px-1.5 py-0 h-4 ${
                                    agent.risky_tools_json.includes(tool)
                                      ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Create Agent Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Create New Agent
            </DialogTitle>
            <DialogDescription>
              Configure an AI agent with custom capabilities and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="My Agent"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="A helpful assistant for..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-muted/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt</Label>
              <Textarea
                id="system_prompt"
                placeholder="You are a helpful AI assistant..."
                value={formData.system_prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                className="bg-muted/30 min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Planner Model</Label>
                <Select
                  value={formData.model_config_json?.planner || defaultModels.planner}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    model_config_json: { ...prev.model_config_json, planner: value }
                  }))}
                >
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Worker Model</Label>
                <Select
                  value={formData.model_config_json?.worker || defaultModels.worker}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    model_config_json: { ...prev.model_config_json, worker: value }
                  }))}
                >
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reasoner Model</Label>
                <Select
                  value={formData.model_config_json?.reasoner || defaultModels.reasoner}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    model_config_json: { ...prev.model_config_json, reasoner: value }
                  }))}
                >
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_steps">Max Steps</Label>
                <Input
                  id="max_steps"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.max_steps}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_steps: parseInt(e.target.value) || 20 }))}
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Daily Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={formData.daily_budget_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, daily_budget_limit: parseFloat(e.target.value) || 5 }))}
                  className="bg-muted/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Enabled Tools</Label>
              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-lg">
                {availableTools.map((tool) => {
                  const isRisky = defaultRiskyTools.includes(tool);
                  return (
                    <div key={tool} className="flex items-center space-x-2">
                      <Checkbox
                        id={tool}
                        checked={formData.enabled_tools_json?.includes(tool) || false}
                        onCheckedChange={(checked) => handleToolToggle(tool, !!checked)}
                      />
                      <label
                        htmlFor={tool}
                        className={`text-xs cursor-pointer ${isRisky ? 'text-yellow-400' : 'text-foreground'}`}
                      >
                        {tool}
                        {isRisky && <Shield className="w-2.5 h-2.5 inline ml-1" />}
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                <Shield className="w-3 h-3 inline mr-1 text-yellow-400" />
                Risky tools require approval before execution
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || !formData.name || !formData.system_prompt}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agent? All associated runs and data will be preserved but the agent configuration will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
