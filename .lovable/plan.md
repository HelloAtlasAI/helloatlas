
## Plan: Atlas Architecture Documentation Page

### Overview

Create a new standalone page `/atlas-architecture` that explains the Atlas Core system architecture, memory system, research pipeline, and AI provider tiers in a visually engaging, interactive format. This page will serve as both documentation and a learning resource for understanding how Atlas works.

---

### Part 1: Page Structure

#### 1.1 Create `src/pages/AtlasArchitecture.tsx`

A new page following the existing patterns from `AtlasCore.tsx` and `AtlasTeach.tsx`:

```text
+------------------------------------------------------------------+
|  Header: Back to Dashboard | Atlas Architecture                   |
+------------------------------------------------------------------+
|                                                                   |
|  [Hero Section with Mini Sphere]                                  |
|  "Understanding Atlas Intelligence"                               |
|  Brief intro paragraph                                            |
|                                                                   |
+------------------------------------------------------------------+
|  Tab Navigation                                                   |
|  [Overview] [AI Providers] [Memory] [Learning] [Sphere]           |
+------------------------------------------------------------------+
|                                                                   |
|  Tab Content Area                                                 |
|                                                                   |
+------------------------------------------------------------------+
```

---

### Part 2: Documentation Sections

#### 2.1 Overview Tab

High-level architecture with interactive diagrams:

| Section | Content |
|---------|---------|
| System Overview | Mermaid diagram showing Frontend → Edge Functions → AI Providers → Storage flow |
| Core Concepts | Cards explaining Voice-First, Persistent Memory, Proactive Intelligence |
| Technology Stack | Visual table of all technologies used |

#### 2.2 AI Providers Tab

Detailed explanation of the multi-model architecture:

| Section | Content |
|---------|---------|
| Provider Cards | Interactive cards for each provider (Lovable AI, Claude, Perplexity, Jina) |
| Model Tier System | Visual diagram of 4-tier model routing |
| Task Routing | Table showing which tasks go to which models |
| Fallback Chains | Visual representation of fallback behavior |
| Budget Routing | Explanation of cost-aware model selection |

#### 2.3 Memory Tab

Explanation of the memory architecture:

| Section | Content |
|---------|---------|
| Memory Tiers | Visual diagram of Working → Short-term → Long-term → Semantic Core |
| Session Context | How working memory tracks conversation state |
| Knowledge Validation | Multi-model validation pipeline diagram |
| Memory Synthesis | Claude Opus integration for memory consolidation |

#### 2.4 Learning Tab

Always-alive learning system documentation:

| Section | Content |
|---------|---------|
| Learning Pipeline | Animated diagram: News Pulse → Topic Discovery → Research → Validation → Storage |
| Scheduled Jobs | Timeline showing cron job frequencies |
| Research Queue | Visual explanation of priority-based research processing |
| Brain Orchestration | 30-minute cycle explanation |

#### 2.5 Sphere Tab

3D visualization system documentation:

| Section | Content |
|---------|---------|
| 6 States | Visual cards for each state (dormant, passive, activated, listening, thinking, speaking) |
| Shader System | Code snippets and visual examples |
| Audio Reactivity | Explanation with demo |
| Customization | How to configure colors and behaviors |

---

### Part 3: Component Architecture

#### 3.1 New Components to Create

| Component | Purpose |
|-----------|---------|
| `src/pages/AtlasArchitecture.tsx` | Main page component |
| `src/components/architecture/ArchitectureOverview.tsx` | Overview tab content |
| `src/components/architecture/AIProvidersSection.tsx` | AI providers documentation |
| `src/components/architecture/MemoryArchitectureSection.tsx` | Memory system docs |
| `src/components/architecture/LearningPipelineSection.tsx` | Learning system docs |
| `src/components/architecture/SphereDocumentation.tsx` | 3D sphere docs |
| `src/components/architecture/ArchitectureDiagram.tsx` | Reusable Mermaid wrapper |
| `src/components/architecture/ConceptCard.tsx` | Reusable concept explanation card |
| `src/components/architecture/CodeBlock.tsx` | Syntax-highlighted code display |

#### 3.2 Reuse Existing Components

- `AIArchitectureDiagram` - Provider visualization (already exists)
- `AtlasSphere` - Mini sphere for hero section
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Navigation
- Motion animations from framer-motion

---

### Part 4: Visual Design

#### 4.1 Design Patterns

Following existing glassmorphic design:

```tsx
// Card pattern
<motion.div
  className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6"
  whileHover={{ borderColor: 'hsl(var(--primary) / 0.5)' }}
>
```

#### 4.2 Color Coding by Section

| Section | Accent Color |
|---------|--------------|
| Overview | Primary (purple) |
| AI Providers | Secondary (blue) |
| Memory | Emerald |
| Learning | Amber |
| Sphere | Cyan |

#### 4.3 Interactive Elements

- Hoverable concept cards with expanded details
- Clickable Mermaid diagrams with zoom
- Animated state transitions in Sphere section
- Code blocks with copy buttons

---

### Part 5: Content Details

#### 5.1 Overview Section Content

**System Overview Diagram (Mermaid):**
```text
graph TB
    User --> Frontend
    Frontend --> EdgeFunctions
    EdgeFunctions --> AIProviders
    EdgeFunctions --> Database
    AIProviders --> LovableAI
    AIProviders --> Claude
    AIProviders --> Perplexity
```

**Core Concepts Cards:**

1. **Voice-First Interaction**
   - Real-time STT via ElevenLabs Scribe
   - Wake word detection
   - Streaming TTS responses

2. **Persistent Memory**
   - 4-tier memory architecture
   - Semantic embeddings
   - Cross-session continuity

3. **Proactive Intelligence**
   - Background research
   - News monitoring
   - Knowledge gap detection

4. **3D Visualization**
   - GPU-accelerated particles
   - State-aware rendering
   - Audio reactivity

#### 5.2 AI Providers Section Content

**Provider Cards:**

| Provider | Tier | Models | Use Cases |
|----------|------|--------|-----------|
| Lovable AI | 1 & 2 | GPT-5, Gemini Flash | Planning, Execution |
| Claude | Memory Core | Opus 4.5, Sonnet 4.5 | Synthesis, Creative |
| Perplexity | 3 | Sonar, Sonar-Pro | Research, Search |
| Jina | Utility | Reader API | Web scraping |

**Routing Logic Diagram:**
```text
Task Type → Model Selection
───────────────────────────────
Planning → GPT-5
Execution → Gemini Flash
Research → Sonar-Pro
Memory → Claude Opus
Creative → Claude Sonnet
```

#### 5.3 Memory Section Content

**Memory Tiers Visual:**
```text
┌─────────────────────────────────────────┐
│  Semantic Core (Synthesized Themes)     │ ← Claude Opus
├─────────────────────────────────────────┤
│  Long-Term Memory (ai_memory + vectors) │ ← Persistent
├─────────────────────────────────────────┤
│  Short-Term Memory (important items)    │ ← Session promoted
├─────────────────────────────────────────┤
│  Working Memory (session_context)       │ ← 30 min expiry
└─────────────────────────────────────────┘
```

**Validation Pipeline:**
- Claude Opus: Reasoning/Context
- Gemini Pro: Fact-checking
- Perplexity: Source verification
- Consensus: 2+ models must agree

#### 5.4 Learning Section Content

**Scheduled Jobs Timeline:**
```text
TIME          JOB
────────────────────────────────
Every 15 min  News Pulse
Every 30 min  Brain Orchestrator
Every 1 hour  Topic Discovery
Every 2 hours Batch Validation
Every 6 hours Memory Consolidation
Daily 2 AM    Full Synthesis
```

**Learning Flow:**
```text
News/Topics → Research Queue → Parallel Processing → Validation → Knowledge Store
```

#### 5.5 Sphere Section Content

**State Visualization:**

| State | Color | Behavior |
|-------|-------|----------|
| Dormant | Blue-gray | Minimal motion |
| Passive | Soft blue | Gentle breathing |
| Activated | Purple | Bright pulse |
| Listening | Cyan | Audio-reactive |
| Thinking | Violet | Swirling motion |
| Speaking | Lavender | Rhythmic pulse |

---

### Part 6: Routing Integration

#### 6.1 Add Route to App.tsx

```tsx
// In src/App.tsx
const AtlasArchitecture = lazy(() => import("./pages/AtlasArchitecture"));

<Route 
  path="/atlas-architecture" 
  element={
    <Suspense fallback={<PageLoader />}>
      <AtlasArchitecture />
    </Suspense>
  } 
/>
```

#### 6.2 Navigation Links

Add link from:
- Dashboard header menu
- Atlas Core page sidebar
- Settings panel

---

### Part 7: Files to Create

| File | Purpose |
|------|---------|
| `src/pages/AtlasArchitecture.tsx` | Main page |
| `src/components/architecture/index.ts` | Barrel export |
| `src/components/architecture/ArchitectureOverview.tsx` | Overview section |
| `src/components/architecture/AIProvidersSection.tsx` | Providers section |
| `src/components/architecture/MemoryArchitectureSection.tsx` | Memory section |
| `src/components/architecture/LearningPipelineSection.tsx` | Learning section |
| `src/components/architecture/SphereDocumentation.tsx` | Sphere section |
| `src/components/architecture/ConceptCard.tsx` | Reusable card |
| `src/components/architecture/TechStackTable.tsx` | Technology table |

### Part 8: Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add lazy route for `/atlas-architecture` |
| `src/components/dashboard/DashboardHeader.tsx` | Add navigation link (if exists) |

---

### Implementation Priority

1. Create main page structure with tabs
2. Implement Overview section with diagrams
3. Add AI Providers section
4. Add Memory section
5. Add Learning section
6. Add Sphere section
7. Add routing and navigation
8. Polish animations and interactivity

---

### Technical Notes

1. **Mermaid Integration**: Use the same pattern as `AIArchitectureDiagram.tsx` for rendering Mermaid diagrams
2. **Performance**: Lazy load heavy sections to keep initial bundle small
3. **Mobile Responsiveness**: All sections should work on mobile with horizontal scroll for diagrams
4. **Accessibility**: Proper headings, alt text for diagrams, keyboard navigation
5. **Content Source**: Pull content from existing `docs/API.md`, `docs/ATLAS-SPHERE.md`, and `README.md`
