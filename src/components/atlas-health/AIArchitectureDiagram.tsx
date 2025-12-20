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
  Brain
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
      name: 'Anthropic Claude',
      connected: true, // Just configured
      icon: <Brain className="w-4 h-4" />,
      description: 'Advanced reasoning, code review, and creative tasks',
      models: ['claude-sonnet-4-5 (Critic/Creative)'],
      tier: 'Tier 4'
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
    end
    
    subgraph Tier1["Tier 1: Planning & Reasoning"]
        F["Lovable AI Gateway"]
        G["GPT-5<br/>Planner"]
        H["GPT-5<br/>Reasoner"]
    end
    
    subgraph Tier2["Tier 2: Execution"]
        I["Gemini 2.5 Flash<br/>Worker"]
    end
    
    subgraph Tier3["Tier 3: Research"]
        J["Perplexity AI"]
        K["sonar-pro<br/>Deep Research"]
        L["sonar<br/>Quick Search"]
    end
    
    subgraph Tier4["Tier 4: Advanced Analysis"]
        M["Anthropic Claude"]
        N["claude-sonnet-4-5<br/>Critic/Creative"]
    end
    
    subgraph Utility["Web Scraping"]
        O["Jina Reader<br/>URL Extraction"]
    end
    
    A --> B
    B --> C
    B --> D
    C --> F
    C --> J
    C --> M
    D --> E
    E --> F
    E --> J
    E --> M
    E --> O
    F --> G
    F --> H
    F --> I
    J --> K
    J --> L
    M --> N

    classDef frontend fill:#1e1b4b,stroke:#6366f1,stroke-width:2px
    classDef edge fill:#1f2937,stroke:#6b7280,stroke-width:1px
    classDef tier1 fill:#4c1d95,stroke:#a855f7,stroke-width:2px
    classDef tier2 fill:#1e3a5f,stroke:#3b82f6,stroke-width:2px
    classDef tier3 fill:#164e63,stroke:#06b6d4,stroke-width:2px
    classDef tier4 fill:#4a1d4a,stroke:#d946ef,stroke-width:2px
    classDef utility fill:#1c1917,stroke:#78716c,stroke-width:1px
    
    class A,B frontend
    class C,D,E edge
    class F,G,H tier1
    class I tier2
    class J,K,L tier3
    class M,N tier4
    class O utility
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
                ? 'bg-primary/5 border-primary/30 hover:border-primary/50' 
                : 'bg-muted/20 border-border/30'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${provider.connected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {provider.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{provider.tier}</span>
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
          <div className="w-3 h-3 rounded-full bg-primary/50 border border-primary" />
          <span>Tier 1/2: Lovable AI (Primary)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-fuchsia-500/50 border border-fuchsia-500" />
          <span>Tier 4: Claude (Advanced)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500/50 border border-cyan-500" />
          <span>Tier 3: Perplexity (Research)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-stone-500/50 border border-stone-500" />
          <span>Utility: Jina (Scraping)</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AIArchitectureDiagram;
