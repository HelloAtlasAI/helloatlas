

## Plan: Provider Auto-Switching & Lovable AI Kill Switch

### Overview

Implement two key features to give users control over AI spending:

1. **Provider Auto-Switching** - Dynamically route requests to cheaper providers when budget thresholds are approached
2. **Lovable AI Kill Switch** - A master toggle to completely disable all Lovable AI usage, preventing credit consumption

---

### Part 1: Database Schema Updates

#### 1.1 Extend `atlas_system_settings` Table

Add new columns for provider control:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `lovable_ai_enabled` | boolean | true | Master kill switch for Lovable AI |
| `auto_switch_enabled` | boolean | true | Enable automatic provider switching |
| `budget_switch_threshold_pct` | int | 70 | Switch to cheaper providers at this % of daily budget |
| `preferred_cheap_provider` | text | 'lovable_ai' | Fallback provider when budget is tight |
| `disable_reason` | text | null | Why Lovable AI was disabled (manual/budget/error) |
| `disabled_at` | timestamp | null | When Lovable AI was disabled |

#### 1.2 Extend `atlas_provider_status` Table

Add routing priority:

| Column | Type | Purpose |
|--------|------|---------|
| `priority_order` | int | Lower = higher priority for routing |
| `cost_tier` | text | 'cheap', 'standard', 'premium' |
| `is_enabled` | boolean | Can this provider be used? |

---

### Part 2: Backend Auto-Switching Logic

#### 2.1 Create `supabase/functions/_shared/providerRouting.ts`

New shared utility for intelligent provider routing:

```typescript
interface RoutingDecision {
  provider: string;
  model: string;
  reason: 'default' | 'budget_switch' | 'provider_down' | 'rate_limited';
  originalProvider?: string;
}

// Main routing function
export async function selectOptimalProvider(
  supabase: SupabaseClient,
  taskType: string,
  preferredProvider?: string
): Promise<RoutingDecision> {
  // 1. Check if Lovable AI is globally disabled
  // 2. Check budget thresholds
  // 3. Check provider health
  // 4. Return optimal provider with reasoning
}

// Cost tier definitions
const COST_TIERS = {
  cheap: ['lovable_ai'], // gemini-flash-lite
  standard: ['lovable_ai', 'perplexity'], // gemini-flash, sonar
  premium: ['openai', 'anthropic'], // gpt-5, claude
};

// Auto-switching rules
const SWITCHING_RULES = {
  // When budget > 70%, downgrade to cheaper models
  budget_warning: { 
    from: 'premium', 
    to: 'standard' 
  },
  // When budget > 90%, downgrade to cheapest
  budget_critical: { 
    from: ['premium', 'standard'], 
    to: 'cheap' 
  },
  // When Lovable AI disabled, use alternatives
  lovable_disabled: {
    fallback: 'perplexity' // or null to block
  },
};
```

#### 2.2 Update Edge Functions with Auto-Switching

Modify these functions to use the new routing system:

**`chat-with-memory/index.ts`:**
- Check `lovable_ai_enabled` before making any Lovable AI calls
- Use `selectOptimalProvider()` for model selection
- Fall back to cached responses or offline mode when all providers unavailable

**`agent-run/index.ts`:**
- Inject budget-aware model selection into `selectModel()`
- Track provider switches in run steps for debugging

**`atlas-research/index.ts`:**
- Completely pause research when Lovable AI is disabled
- Use cheaper models for initial topic discovery

**`atlas-knowledge/index.ts`:**
- Skip knowledge extraction when Lovable AI disabled
- Use cheaper validation when budget is tight

---

### Part 3: Frontend Kill Switch & Controls

#### 3.1 Update `src/hooks/useAtlasProviderStatus.ts`

Add new state and mutations:

```typescript
// New state
lovableAIEnabled: boolean;
autoSwitchEnabled: boolean;
currentRoutingMode: 'normal' | 'budget_saving' | 'minimal' | 'disabled';

// New mutations
disableLovableAI: (reason: string) => void;
enableLovableAI: () => void;
setAutoSwitchEnabled: (enabled: boolean) => void;
setBudgetSwitchThreshold: (pct: number) => void;
```

#### 3.2 Create `src/components/atlas-health/LovableAIControlPanel.tsx`

Prominent control panel for Lovable AI:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔌 Lovable AI Control                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │  ⚡ Lovable AI                                    [████ ON ████] │ │
│ │                                                                 │ │
│ │  Master switch for all Lovable AI operations.                   │ │
│ │  Disabling this stops ALL credit usage immediately.             │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Status: Active (gemini-2.5-flash)                                   │
│ Today's Usage: $2.45 / $5.00 (49%)                                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ 🔄 Auto Budget Protection                              [ON]         │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │  Switch to cheaper models at:  [====●========] 70%              │ │
│ │  Auto-disable at budget limit:  [●] Enabled                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ Current Mode: ● Normal Operation                                    │
│               ○ Budget Saving (cheaper models)                      │
│               ○ Minimal (essential only)                            │
│               ○ Disabled (no AI calls)                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Features:
- Large, prominent toggle for Lovable AI (hard to miss)
- Clear warning when disabling ("Atlas will have limited functionality")
- Status indicator showing current routing mode
- Auto-switch threshold slider (50-90%)
- Visual indicator of current cost tier in use

#### 3.3 Update `src/components/atlas-health/LearningControlPanel.tsx`

Add Lovable AI status banner at top:

```tsx
{!lovableAIEnabled && (
  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 mb-4">
    <div className="flex items-center gap-2">
      <PowerOff className="w-4 h-4 text-red-400" />
      <span className="text-sm font-medium text-red-400">
        Lovable AI is disabled - Learning is unavailable
      </span>
    </div>
  </div>
)}
```

#### 3.4 Update `src/components/atlas-health/BudgetSettingsPanel.tsx`

Add quick-disable button:

```tsx
<Button
  variant="destructive"
  size="sm"
  onClick={() => disableLovableAI('manual')}
  className="gap-2"
>
  <PowerOff className="w-4 h-4" />
  Emergency Stop
</Button>
```

---

### Part 4: Auto-Switching Algorithm

#### 4.1 Budget-Based Routing

```
Daily Budget: $5.00
Current Spend: $X.XX

ROUTING LOGIC:
────────────────────────────────────────────────────────
 0%────────50%────────70%────────90%────────100%
 │         │          │          │           │
 │  NORMAL │  NORMAL  │ BUDGET   │ MINIMAL   │ DISABLED
 │         │          │ SAVING   │           │
────────────────────────────────────────────────────────
                      ↓          ↓           ↓
                      Switch to  Only        Auto-disable
                      gemini-    essential   learning
                      flash-lite calls
```

#### 4.2 Provider Health Fallback Chain

```
Primary Request (e.g., planning task):
  1. Check if Lovable AI enabled → If NO, skip to step 4
  2. Check budget tier → Select appropriate model
  3. Check provider health → If unhealthy, try next
  4. Fallback chain:
     - Lovable AI (gemini-flash) → failed
     - Lovable AI (gemini-flash-lite) → failed  
     - Perplexity (sonar) → failed
     - Return error / cached response
```

#### 4.3 Task-Based Routing Adjustments

| Task Type | Normal Mode | Budget Saving | Minimal |
|-----------|-------------|---------------|---------|
| Chat | gemini-flash | gemini-flash-lite | gemini-flash-lite |
| Planning | gpt-5 | gemini-flash | gemini-flash-lite |
| Research | sonar-pro | sonar | BLOCKED |
| Knowledge | gemini-flash | BLOCKED | BLOCKED |
| Memory | claude-sonnet | gemini-flash | BLOCKED |

---

### Part 5: Integration Points

#### 5.1 Dashboard Integration

Update `AtlasCoreDashboard.tsx`:
- Add `LovableAIControlPanel` in a prominent position
- Show routing mode in header status
- Add emergency stop button in sidebar

#### 5.2 Real-time Status Updates

When Lovable AI is disabled:
- All dependent panels show disabled state
- Learning panel shows "Lovable AI Required"
- Research panel shows "Paused - Enable Lovable AI to continue"
- Chat responses use cached/local mode messaging

#### 5.3 Notification System

Toast notifications for:
- "Switching to budget-saving mode (70% of daily budget used)"
- "Lovable AI disabled - All AI operations paused"
- "Lovable AI re-enabled"
- "Auto-switched to gemini-flash-lite due to rate limiting"

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/xxx_provider_routing.sql` | Schema updates |
| `supabase/functions/_shared/providerRouting.ts` | Routing logic |
| `src/components/atlas-health/LovableAIControlPanel.tsx` | Kill switch UI |

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAtlasProviderStatus.ts` | Add Lovable AI control state |
| `src/hooks/useSpendingAlerts.ts` | Add routing mode awareness |
| `supabase/functions/chat-with-memory/index.ts` | Check kill switch, use routing |
| `supabase/functions/agent-run/index.ts` | Budget-aware model selection |
| `supabase/functions/atlas-research/index.ts` | Respect kill switch |
| `supabase/functions/atlas-knowledge/index.ts` | Respect kill switch |
| `supabase/functions/atlas-control/index.ts` | Add Lovable AI control endpoints |
| `src/components/atlas-health/LearningControlPanel.tsx` | Show disabled state |
| `src/components/atlas-health/BudgetSettingsPanel.tsx` | Add emergency stop |
| `src/components/atlas-health/AtlasCoreDashboard.tsx` | Integrate new panel |

---

### User Experience Flow

**Scenario: User tops up credits and Atlas consumes them quickly**

1. User tops up $10 in Lovable AI credits
2. Atlas starts learning/researching (consumes credits)
3. User sees spending alerts at 70% and 90%
4. User can:
   - **Option A**: Click "Emergency Stop" to immediately disable Lovable AI
   - **Option B**: Rely on auto-disable at 100% of daily budget
   - **Option C**: Lower daily budget to $2 to preserve credits
5. When disabled, Atlas shows clear messaging:
   - "Lovable AI is paused. I can still help with basic tasks using cached knowledge."
6. User can re-enable when ready to use more credits

**Scenario: Budget protection prevents credit drain**

1. User sets daily budget to $3
2. Auto-switch threshold at 70%
3. At $2.10 spent (70%), system switches to cheaper models
4. At $2.85 spent (95%), system shows critical warning
5. At $3.00 spent (100%), learning auto-disables
6. Basic chat continues but with cheaper models
7. Next day, budget resets and full functionality resumes

---

### Technical Notes

1. **Kill Switch Priority**: The `lovable_ai_enabled` check happens FIRST in every edge function, before any API calls
2. **Graceful Degradation**: When Lovable AI is disabled, functions return informative errors, not crashes
3. **State Persistence**: Disable state persists across sessions and page reloads
4. **Realtime Updates**: UI updates immediately when settings change via Supabase realtime
5. **No Hidden Consumption**: All AI calls are blocked when disabled - no background tasks

