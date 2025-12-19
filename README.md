# Atlas - Voice-First AI Assistant

A sophisticated voice-first AI assistant with persistent memory, real-time speech recognition, and an immersive 3D visualization system. Built with React, TypeScript, and Supabase.

## Overview

Atlas is an ambient AI companion that combines:
- **Voice-First Interaction** - Real-time speech-to-text via ElevenLabs Scribe
- **Persistent Memory** - Learns and remembers user preferences across sessions
- **Proactive Intelligence** - Surfaces relevant information contextually
- **Immersive Visualization** - Dynamic 3D sphere that responds to AI state and audio

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| 3D Graphics | Three.js, React Three Fiber |
| Backend | Supabase (Lovable Cloud) |
| AI/LLM | Google Gemini 2.5 Flash |
| Voice STT | ElevenLabs Scribe (Real-time) |
| Voice TTS | ElevenLabs Streaming TTS |
| State Management | TanStack Query, React Context |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Voice     │  │  Dashboard  │  │    Atlas Sphere 3D      │  │
│  │  Controls   │  │   Cards     │  │    Visualization        │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
│  ┌──────┴────────────────┴──────────────────────┴──────────┐    │
│  │                    React Hooks Layer                     │    │
│  │  useRealtimeScribe │ useStreamingTTS │ useUnifiedChat   │    │
│  └──────────────────────────────┬───────────────────────────┘    │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────┐
│                    Supabase Edge Functions                       │
├─────────────────────────────────────────────────────────────────┤
│  chat-with-memory │ atlas-knowledge │ elevenlabs-* │ get-*      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
┌─────────────────────────────────┼───────────────────────────────┐
│                      External Services                           │
├─────────────────────────────────────────────────────────────────┤
│     ElevenLabs API     │    Gemini API    │   Weather/News APIs │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Lovable Cloud project (provides Supabase backend)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

The following environment variables are automatically configured via Lovable Cloud:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |

### Required Secrets (Edge Functions)

Configure these in Lovable Cloud → Secrets:

| Secret | Service | Purpose |
|--------|---------|---------|
| `ELEVENLABS_API_KEY` | ElevenLabs | Voice STT/TTS |
| `LOVABLE_API_KEY` | Lovable AI | LLM access (Gemini) |
| `OPENWEATHER_API_KEY` | OpenWeather | Weather data |
| `NEWS_API_KEY` | NewsAPI | News headlines |
| `FINNHUB_API_KEY` | Finnhub | Stock quotes |
| `PERPLEXITY_API_KEY` | Perplexity | Web search |

## Project Structure

```
src/
├── components/
│   ├── atlas/              # 3D Sphere visualization system
│   │   ├── AtlasCore.tsx   # Main rendering component
│   │   ├── AtlasSphere.tsx # Public API component
│   │   ├── systems/        # GPU particle systems
│   │   ├── shaders/        # GLSL shaders
│   │   ├── hooks/          # Animation & quality hooks
│   │   └── utils/          # State configs, textures
│   ├── dashboard/          # Dashboard cards & layouts
│   │   ├── effects/        # Weather effects (rain, snow)
│   │   ├── expanded/       # Full-screen card views
│   │   └── layouts/        # Layout modes
│   ├── aria/               # Voice UI components
│   └── ui/                 # Shadcn UI components
├── hooks/
│   ├── useRealtimeScribeStable.ts  # Real-time STT
│   ├── useStreamingTTS.ts          # Streaming TTS
│   ├── useUnifiedChat.ts           # AI conversation
│   ├── useWakeWord.ts              # Wake word detection
│   └── useAtlas*.ts                # Atlas feature hooks
├── pages/
│   ├── Dashboard.tsx       # Main dashboard
│   ├── AtlasTeach.tsx      # Teaching/learning mode
│   ├── AtlasCore.tsx       # Fullscreen sphere
│   └── AtlasDemo.tsx       # Visualization demo
├── lib/
│   ├── animations.ts       # Animation utilities
│   └── performance.ts      # Performance helpers
└── types/
    └── index.ts            # Shared type definitions

supabase/
└── functions/
    ├── chat-with-memory/   # Main AI conversation
    ├── atlas-knowledge/    # Knowledge extraction
    ├── elevenlabs-*/       # Voice functions
    ├── get-weather/        # Weather API
    ├── get-news/           # News API
    └── get-stocks/         # Stock API

docs/
├── API.md                  # Edge Functions API reference
└── ATLAS-SPHERE.md         # 3D visualization docs
```

## Design System

### Color Palette

The design uses a dark theme with purple accents. All colors are defined as HSL in `src/index.css`:

```css
/* Primary Colors */
--primary: 270 60% 55%;           /* Purple accent */
--primary-foreground: 0 0% 100%;

/* Background Layers */
--background: 240 10% 4%;         /* Deep dark */
--card: 240 6% 8%;                /* Elevated surfaces */
--muted: 240 5% 15%;              /* Subtle backgrounds */

/* State Colors */
--atlas-dormant: 220 30% 40%;     /* Muted blue-gray */
--atlas-passive: 210 40% 50%;     /* Soft blue */
--atlas-activated: 270 60% 55%;   /* Purple */
--atlas-listening: 200 80% 55%;   /* Cyan */
--atlas-thinking: 280 70% 60%;    /* Violet */
--atlas-speaking: 260 70% 60%;    /* Lavender */
```

### Typography

```css
/* Font Stack */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Scale */
text-xs:   0.75rem   /* 12px - Labels, captions */
text-sm:   0.875rem  /* 14px - Secondary text */
text-base: 1rem      /* 16px - Body text */
text-lg:   1.125rem  /* 18px - Subheadings */
text-xl:   1.25rem   /* 20px - Section headers */
text-2xl:  1.5rem    /* 24px - Page titles */
```

### Glassmorphic Cards

Standard card pattern used throughout:

```tsx
<div className="
  bg-card/80 
  backdrop-blur-xl 
  border border-white/10 
  rounded-2xl 
  shadow-xl
">
  {/* Content */}
</div>
```

### Animation Standards

Defined in `tailwind.config.ts`:

```typescript
// Fade animations
'fade-in': 'fade-in 0.3s ease-out'
'fade-out': 'fade-out 0.3s ease-out'

// Scale animations
'scale-in': 'scale-in 0.2s ease-out'
'scale-out': 'scale-out 0.2s ease-out'

// Slide animations
'slide-in-right': 'slide-in-right 0.3s ease-out'

// Combined
'enter': 'fade-in 0.3s ease-out, scale-in 0.2s ease-out'
```

## Key Type Definitions

```typescript
// AI State - Controls sphere visualization
type AIState = 
  | 'dormant'    // Inactive, minimal animation
  | 'passive'    // Wake word listening
  | 'activated'  // Just activated, transitioning
  | 'listening'  // Actively listening to user
  | 'thinking'   // Processing/generating response
  | 'speaking';  // TTS output active

// Wake Word State - Voice detection states
type WakeWordState = 
  | 'dormant' 
  | 'listening' 
  | 'activated' 
  | 'processing' 
  | 'responding' 
  | 'error';

// Message - Chat message structure
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  citations?: Citation[];
}

// Citation - Source reference
interface Citation {
  title: string;
  url: string;
  snippet?: string;
  domain?: string;
  credibilityScore?: number;
}
```

## Voice Interaction Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Dormant    │────▶│   Passive    │────▶│  Activated   │
│  (sleeping)  │     │ (wake word)  │     │ (triggered)  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
       ┌─────────────────────────────────────────┘
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Listening   │────▶│  Thinking    │────▶│  Speaking    │
│ (user talks) │     │ (AI process) │     │ (TTS output) │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │
                                                 ▼
                                          Back to Passive
```

## Database Schema

Key tables in the Supabase database:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (name, avatar, preferences) |
| `ai_memory` | Persistent memory items (preferences, facts) |
| `atlas_knowledge_entries` | Extracted knowledge with embeddings |
| `atlas_research_topics` | Background research tasks |
| `conversations` | Chat conversation history |
| `messages` | Individual chat messages |
| `user_events` | Calendar events |
| `user_tasks` | Todo items |
| `user_notes` | Notes and documents |

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Code Style

- TypeScript strict mode enabled
- ESLint with React hooks rules
- Prettier for formatting
- Tailwind CSS for styling (use semantic tokens!)

### Testing Edge Functions

Edge functions are deployed automatically. View logs in Lovable Cloud.

## Documentation

- [API Reference](./docs/API.md) - Complete edge function documentation
- [Atlas Sphere](./docs/ATLAS-SPHERE.md) - 3D visualization system guide

## Deployment

Deploy via Lovable:

1. Open your project in Lovable
2. Click **Share → Publish**
3. Click **Update** to deploy changes

Frontend changes require clicking Update. Backend (edge functions) deploy automatically.

## License

Private project - All rights reserved.
