import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Network, 
  Cpu, 
  Search, 
  Globe,
  Sparkles,
  Zap,
  Brain,
  Database
} from 'lucide-react';
import mermaid from 'mermaid';

interface ProviderStatus {
  name: string;
  connected: boolean;
  icon: React.ReactNode;
  description: string;
  models: string[];
  tier: string;
}

const AIArchitectureDiagram = () => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Provider status based on typical configuration
  const providers: ProviderStatus[] = [
    {
      name: 'Lovable AI Gateway',
      connected: true, // Always available
      icon: <Sparkles className="w-4 h-4" />,
      description: 'Primary AI provider for planning, execution, and reasoning',
      models: ['openai/gpt-5 (Planner/Reasoner)', 'google/gemini-2.5-flash (Worker)'],
      tier: 'Tier 1 & 2'
    },
    {
      name: 'Claude Opus 4.5',
      connected: true,
      icon: <Brain className="w-4 h-4" />,
      description: 'Memory Core - synthesis, consolidation, and advanced reasoning',
      models: ['claude-opus-4-5 (Memory Core)', 'claude-sonnet-4-5 (Critic/Creative)'],
      tier: 'Memory Core'
    },
    {
      name: 'Perplexity AI',
      connected: true, // Configured via connector
      icon: <Search className="w-4 h-4" />,
      description: 'Web search and research with citations',
      models: ['sonar-pro (Research)', 'sonar (Search)'],
      tier: 'Tier 3'
    },
    {
      name: 'Jina Reader',
      connected: true, // Free, no key needed
      icon: <Globe className="w-4 h-4" />,
      description: 'Web scraping and URL content extraction',
      models: ['Jina Reader API (Free)'],
      tier: 'Utility'
    }
  ];

  const diagramDefinition = `
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#a855f7', 'primaryTextColor': '#fff', 'primaryBorderColor': '#a855f7', 'lineColor': '#6b7280', 'secondaryColor': '#1f2937', 'tertiaryColor': '#111827' }}}%%
graph TB
    subgraph Frontend["Frontend (React)"]
        A[User Request]
        B[useUnifiedChat Hook]
    end
    
    subgraph EdgeFunctions["Edge Functions"]
        C[chat-with-memory]
        D[agent-run]
        E[tool-gateway]
        F[memory-synthesize]
    end
    
    subgraph MemoryCore["Memory Core (Claude Opus 4.5)"]
        G["claude-opus-4-5"]
        H["Memory Synthesis"]
        I["Conflict Resolution"]
        J["Insight Extraction"]
    end
    
    subgraph Tier1["Tier 1: Planning & Reasoning"]
        K["Lovable AI Gateway"]
        L["GPT-5<br/>Planner"]
        M["GPT-5<br/>Reasoner"]
    end
    
    subgraph Tier2["Tier 2: Execution"]
        N["Gemini 2.5 Flash<br/>Worker"]
    end
    
    subgraph Tier3["Tier 3: Research"]
        O["Perplexity AI"]
        P["sonar-pro<br/>Deep Research"]
    end
    
    subgraph Tier4["Tier 4: Analysis"]
        Q["claude-sonnet-4-5<br/>Critic/Creative"]
    end
    
    subgraph Memory["Memory Storage"]
        R["ai_memory"]
        S["session_context"]
        T["atlas_knowledge"]
    end
    
    A --> B
    B --> C
    B --> D
    C --> G
    C --> K
    C --> O
    D --> E
    D --> F
    F --> G
    G --> H
    G --> I
    G --> J
    E --> K
    E --> O
    E --> Q
    K --> L
    K --> M
    K --> N
    O --> P
    H --> R
    I --> R
    J --> T
    C --> S

    classDef frontend fill:#1e1b4b,stroke:#6366f1,stroke-width:2px
    classDef edge fill:#1f2937,stroke:#6b7280,stroke-width:1px
    classDef memoryCore fill:#7c2d12,stroke:#f97316,stroke-width:2px
    classDef tier1 fill:#4c1d95,stroke:#a855f7,stroke-width:2px
    classDef tier2 fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px
    classDef tier3 fill:#164e63,stroke:#06b6d4,stroke-width:2px
    classDef tier4 fill:#4a1d4a,stroke:#d946ef,stroke-width:2px
    classDef storage fill:#1c1917,stroke:#78716c,stroke-width:1px
    
    class A,B frontend
    class C,D,E,F edge
    class G,H,I,J memoryCore
    class K,L,M tier1
    class N tier2
    class O,P tier3
    class Q tier4
    class R,S,T storage
`;

  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramRef.current) return;

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
            padding: 15,
          },
          themeVariables: {
            primaryColor: '#a855f7',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#a855f7',
            lineColor: '#6b7280',
            secondaryColor: '#1f2937',
            tertiaryColor: '#111827',
            background: '#0a0a0a',
            mainBkg: '#1f2937',
            nodeBorder: '#a855f7',
          }
        });

        const { svg } = await mermaid.render('ai-architecture-diagram', diagramDefinition);
        diagramRef.current.innerHTML = svg;
        setIsRendered(true);
        setError(null);
      } catch (e) {
        console.error('Mermaid rendering error:', e);
        setError('Failed to render diagram');
      }
    };

    renderDiagram();
  }, []);

  return (
    <motion.div
      className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          AI Provider Architecture
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Cpu className="w-4 h-4" />
          Multi-Model Orchestration
        </div>
      </div>

      {/* Provider Status Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {providers.map((provider, index) => (
          <motion.div
            key={provider.name}
            className={`relative p-4 rounded-xl border backdrop-blur-sm transition-all ${
              provider.connected 
                ? provider.tier === 'Memory Core'
                  ? 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50'
                  : 'bg-primary/5 border-primary/30 hover:border-primary/50' 
                : 'bg-muted/20 border-border/30'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  provider.tier === 'Memory Core' 
                    ? 'bg-orange-500/20 text-orange-500'
                    : provider.connected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {provider.icon}
                </div>
                <span className={`text-xs font-medium ${
                  provider.tier === 'Memory Core' ? 'text-orange-400' : 'text-muted-foreground'
                }`}>{provider.tier}</span>
              </div>
              {provider.connected ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <h4 className="font-medium text-sm mb-1 truncate">{provider.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{provider.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {provider.models.slice(0, 2).map((model) => (
                <span 
                  key={model} 
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/50 text-muted-foreground truncate max-w-full"
                >
                  {model.split(' ')[0]}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mermaid Diagram */}
      <div className="relative overflow-hidden rounded-xl border border-border/30 bg-background/20 p-4">
        {error ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : (
          <motion.div
            ref={diagramRef}
            className="w-full overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto [&_.node_rect]:rx-8 [&_.node_rect]:ry-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: isRendered ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
        
        {!isRendered && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500/50 border border-orange-500" />
          <span>Memory Core: Claude Opus 4.5</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary/50 border border-primary" />
          <span>Tier 1/2: Lovable AI (Primary)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-fuchsia-500/50 border border-fuchsia-500" />
          <span>Tier 4: Claude Sonnet 4.5</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500/50 border border-cyan-500" />
          <span>Tier 3: Perplexity (Research)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-stone-500/50 border border-stone-500" />
          <span>Storage: Memory Tables</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AIArchitectureDiagram;
