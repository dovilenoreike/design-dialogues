# Design Dialogues — Claude Code Guide

## What this project is
A material matching engine for interior design. The core value is the matching/ranking models: given a
room and the surfaces already chosen, they recommend materials (floors, walls, cabinets, worktops) that
complete a **harmonious, complementary** palette — not just similar-looking ones. See `useGraphMaterials.ts`,
`lib/graph-compatibility.ts`, `lib/palette-scoring-v2.ts`, `lib/archetype-rules.ts`.

AI-generated visualisation is a **secondary extra** layered on top so users can preview a palette as a photo
— it is not the main product. Mobile-first; also works on desktop.

## Tech stack
- **React 18 + TypeScript + Vite**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **React Router v6** — sub-path routing for design tabs (`/design`, `/design/visual`, `/design/specs`)
- **Supabase** — materials DB, auth, storage
- **i18n** — `useLanguage()` hook + `src/locales/en.json` / `lt.json`. Always add both locales when adding new strings.
- **Vercel** deploy; `vercel.json` in root

## Project structure
```
src/
  App.tsx                  — router setup; all routes land on Index
  pages/Index.tsx          — entry point; renders AppShell + MainContent
  contexts/
    DesignContext.tsx       — global design state (activeTab, room, tier, slots, URL sync)
    LanguageContext.tsx     — i18n
    CreditsContext.tsx      — generation credits
  components/
    mobile/
      AppShell.tsx          — Header + main + BottomTabBar wrapper
      BottomTabBar.tsx      — 3-tab nav (konceptas / vizualas / specs)
      MainContent.tsx       — renders the active tab view
      Stage.tsx             — visualisation display (photo / generated image)
      views/
        KonceptasView.tsx   — concept/moodboard tab (flatlay + material slots)
        DesignView.tsx      — parent shell for the 3 design sub-tabs
        VibePickerView.tsx  — vibe/style selector
        SpecsView.tsx
        BudgetView.tsx
        PlanView.tsx
      controls/
        MaterialSlotPicker.tsx  — material picker (mobile = portal panel, desktop = inline)
  hooks/
    useGenerationState.ts   — AI image generation logic (DO NOT modify prompts without approval)
    useGraphMaterials.ts    — material graph/ranking
  lib/
    url-state.ts            — buildUrl() / parseUrlState()
    palette-scoring-v2.ts   — material scoring
    collection-matching.ts  — vibe-aware collection matching
  integrations/supabase/   — Supabase client; materials live in the DB, not local files
  data/                    — local config data only (see "Data system" below)
    collections/, archetypes/, rooms/, styles/, atmospheres/, architectures/
```

## Sub-tab routing (mobile design view)
- `/design` → concept/moodboard tab (KonceptasView)
- `/design/visual` → visualisation tab (Stage)
- `/design/specs` → specs tab (SpecsView)
- Navigation: `navigate("/design/visual")` in DesignView's `handleSubTabChange`
- BottomTabBar reads `location.pathname` to set active tab

## Brand colors — ALWAYS use these, never generic Tailwind color classes
| Use | Value | How to apply |
|-----|-------|-------------|
| Brand accent / success | `#647d75` (sage green) | `style={{ color: '#647d75' }}` or `text-[#647d75]` |
| Error / failure | `#9a3412` | `style={{ color: '#9a3412' }}` |
| Warning / disclaimer | `#ca8a04` (ochre) | `style={{ color: '#ca8a04' }}` |

Never use `text-green-*`, `text-red-*`, `text-yellow-*` for semantic states.

## Event bubbling — critical pattern
`DesignView` and `KonceptasView` wrap content in divs with `onClick={() => setActiveSlot(null)}`. **Any interactive element nested inside must call `e.stopPropagation()`**, including:
- The element itself AND its wrapper div if the wrapper has padding/margin (tap can land on wrapper, not element)
- Radix/shadcn `<DialogContent>` — portalled but React synthetic events still bubble
- `<label>` wrappers around file inputs

## Mobile touch targets
Minimum 44px tall for all interactive elements. Use `min-h-[44px]` not `h-8`.

## Material picker — mobile vs desktop
- **Mobile** (`inline=false`): renders via `createPortal` to `document.body` as a fixed-bottom panel
- **Desktop** (`inline=true`): renders inline in the DOM
- Do NOT reintroduce vaul `Drawer` for mobile — it was replaced in June 2026
- Progressive disclosure steps: archetypes → directions → shades → browse
- DesignView adds `paddingBottom: 160px` on mobile when picker is active

## Data system
**Materials live in Supabase**, not in local files. Fetch/rank them via `useGraphMaterials.ts`, which
returns `SupabaseMaterial` records (name, imageUrl, tier, scores, clusterId, synonymId, etc.). Scoring
and ranking go through `src/lib/graph-compatibility.ts` + `src/lib/palette-scoring-v2.ts` +
`src/lib/archetype-rules.ts`.

Local `src/data/` holds only **config/taxonomy data**, not the material catalog:
- `collections/`, `archetypes/`, `rooms/surfaces.ts`, `styles/`, `atmospheres/`, `architectures/`
- `designers/`, `sourcing/`, `cost-insights.ts`, `layout-audit-rules.ts`

The old local-file material system (`data/palettes/*.json`, `types/palette.ts`, `lib/palette-utils.ts`,
`palette-scoring-old.ts`) has been fully removed. Do not reintroduce it.

## Processing new materials
When asked to "process new materials": run `scripts/process-material.ts`. Do NOT score images manually.
- Source images must be JPEG/PNG (not WebP) — BCGSC API rejects WebP
- Place in `src/assets/new-materials/{role}/` for new, or `src/assets/new-materials/update/` for updates
- Full workflow in `~/.claude/projects/.../memory/workflow_process_materials.md`

## Ranking goal
The material ranking system aims for **palette harmony and completion**, not similarity. A light floor against dark cabinets is correct; a matching floor that blends in is wrong. See `~/.claude/projects/.../memory/feedback_ranking_goal.md`.

## AI image generation prompts
Do NOT modify the prompt strings in `src/hooks/useGenerationState.ts` without explicit user approval. The current results are intentional.

## Swipe-to-dismiss
Use vaul `Drawer` (or `createPortal` fixed panel) for any panel nested inside `overflow-hidden` ancestors. Custom gesture code (pointer events, touch transforms) fails silently inside overflow-hidden containers.

## Running the project
```bash
npm run dev       # dev server
npm run build     # production build
```
Supabase env vars are in `.env.local` (not committed).
