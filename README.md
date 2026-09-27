# AI Decision Centre

A privacy-first web app that helps people compare AI tools by task fit, data exposure, and cost before committing — with a local redaction gate, AI-powered reasoning, and voice briefings.

Built for ShellHacks 2026.

---

## Problem

Students and professionals choose AI tools (ChatGPT, Claude, Gemini, etc.) without understanding how those tools handle their data, what they cost, or whether they actually fit the task at hand. There is no single place to compare options across task fit, privacy exposure, and price — and no built-in safeguard against pasting sensitive personal information into a third-party AI service.

## Solution

AI Decision Centre provides a guided five-screen flow that compares AI tools side-by-side using structured data, applies a local privacy redaction gate before any text is shared, generates a recommendation powered by Gemini's reasoning over the supplied tool data, and delivers an optional voice briefing via ElevenLabs. Every recommendation clearly separates verifiable facts (pricing and privacy from official sources) from AI-generated reasoning, so users can trust the evidence and evaluate the advice.

---

## Key User Flow

```
Landing → Decision Setup → AI Comparison → Privacy Gate → Decision Result
```

1. **Landing** — Overview of the app's value: task fit, privacy, cost, and redaction.
2. **Decision Setup** — User selects a task (research, writing, coding, images, study, meetings), a budget tier, a data sensitivity level, and a priority (capability, privacy, cost, or balanced).
3. **AI Comparison** — All candidate tools are displayed as cards with fit scores, cost badges, and privacy badges. Tools are ranked by the scoring algorithm and filtered by the user's budget and sensitivity constraints. Each card links to official pricing and privacy sources.
4. **Privacy Gate** — Before using any AI tool, the user can paste text into the Privacy Gate. Sensitive patterns (emails, phone numbers, ID-like strings, common personal names) are detected and highlighted entirely in the browser. The user can redact automatically and copy the cleaned text. **No pasted text ever leaves the browser.**
5. **Decision Result** — A recommendation card showing the best-fit tool, its task fit, estimated cost, data exposure level, a recommended workflow, AI reasoning with contributing factors, confidence score, and official source links. The user can save the decision or hear a voice briefing.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | lucide-react |
| Backend / database | Supabase (PostgreSQL) |
| AI reasoning | Google Gemini API (via Supabase Edge Function) |
| Voice briefing | ElevenLabs API (via Supabase Edge Function) |
| Runtime (edge functions) | Deno (Supabase Edge Functions) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Browser (Client)                     │
│                                                      │
│  React + TypeScript SPA                              │
│  ├── Screens: Landing, Setup, Comparison,           │
│  │   Privacy Gate, Result                            │
│  ├── Client-side redaction engine (no network)       │
│  ├── Local deterministic fallback decision engine    │
│  └── Supabase JS client (anon key, read + insert)     │
│                                                      │
└──────────┬──────────────────────┬────────────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐    ┌──────────────────┐
│  Supabase        │    │  Supabase        │
│  Edge Function:  │    │  Edge Function:  │
│  gemini-decision │    │  voice-briefing  │
│                  │    │                  │
│  Calls Gemini    │    │  Calls           │
│  API server-side │    │  ElevenLabs API  │
│  (key never      │    │  server-side     │
│   exposed to     │    │  (key never      │
│   client)        │    │   exposed to     │
│                  │    │   client)        │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
  Google Gemini API      ElevenLabs API

           ┌──────────────────┐
           │  Supabase        │
           │  PostgreSQL DB   │
           │                  │
           │  ai_tools table  │
           │  (reference data)│
           │                  │
           │  saved_decisions │
           │  table (user     │
           │  saves, keyed by  │
           │  session_id)     │
           └──────────────────┘
```

### React / TypeScript Frontend

A single-page application with five screens managed by a central React context (`AppContext`). The context holds the user's configuration, the computed decision result, the redaction state, saved decisions, tool data (loaded from Supabase or a local fallback), and the analysis state. Navigation is handled by a simple screen-state router — no external routing library.

### Supabase / PostgreSQL

Two tables:

- **`ai_tools`** — Structured reference data about each AI tool (name, description, cost category, pricing label, privacy label, privacy notes, strongest use case, supported tasks, task fit scores, and official/pricing/privacy URLs). Read-only from the client via RLS policies. Seeded via migration.
- **`saved_decisions`** — Stores user-saved decision results, keyed by an anonymous `session_id` generated client-side (UUID in `localStorage`). No login required. RLS policies allow anon and authenticated users to read and insert their own rows.

### Gemini Edge Function (`gemini-decision`)

A Supabase Edge Function (Deno runtime) that receives the user's preferences (task, budget, sensitivity, priority) and a list of candidate tools (already filtered for budget and sensitivity compatibility). It constructs a prompt instructing Gemini to reason over the supplied structured data only — not to invent pricing, privacy claims, or capabilities, and not to browse the internet. Gemini returns a structured JSON recommendation (recommended tool, task fit, cost fit, exposure level, reasoning, workflow, confidence, and contributing factors). The function validates that the recommended tool ID exists in the candidate list before returning the result to the client.

**Gemini's role:** Structured decision reasoning over supplied AI-tool data and user preferences. Gemini does not see the user's pasted text from the Privacy Gate — it only receives the filtered candidate tool data and the user's configuration selections.

### ElevenLabs Edge Function (`voice-briefing`)

A Supabase Edge Function (Deno runtime) that receives a short text string and calls the ElevenLabs text-to-speech API to generate an audio briefing. The audio is returned to the client as an MPEG blob and played in-browser via an `<audio>` element.

**ElevenLabs' role:** Generates a short voice briefing from the safe decision summary only. The briefing text is built client-side from the recommendation result (task, budget, sensitivity, tool name, cost, and a one-sentence reason) — never from the user's original Privacy Gate text.

### Client-side Privacy Gate

The Privacy Gate is a fully client-side feature. Sensitive pattern detection (emails, phone numbers, ID-like strings, common personal names) runs in the browser using regular expressions. Redaction replaces matched patterns with placeholder labels (e.g. `[EMAIL ADDRESS]`). The highlighted preview and redacted output are rendered in React without any network call.

---

## Privacy Architecture

This is the core design principle of the app:

- **Sensitive pasted text is processed locally in the browser.** The Privacy Gate uses client-side regex detection and string replacement. No `fetch`, `supabase`, or any network call exists in the redaction module or the Privacy Gate screen.
- **Original text is not sent to Gemini.** The Gemini edge function receives only the user's configuration (task, budget, sensitivity, priority) and the candidate tool data. It never receives pasted text.
- **Original text is not sent to ElevenLabs.** The voice briefing edge function receives only a pre-built safe summary derived from the recommendation result (tool name, cost, task, and a one-sentence reason). It never receives pasted text.
- **Original text is not stored in Supabase.** The `saved_decisions` table stores the decision result (recommended tool, cost, exposure, reasoning, workflow, confidence, factors) and the user's configuration — never the user's pasted text.

---

## Fallback Behaviour

The app is designed to degrade gracefully when external AI services are unavailable:

- **Gemini unavailable:** If the `gemini-decision` edge function returns an error (API key missing, Gemini API failure, network error, or malformed response), the app falls back to a local deterministic ranking algorithm (`buildDecisionResult` in `src/logic/decision.ts`). This algorithm scores each candidate tool using weighted task fit, privacy rank, and cost rank based on the user's selected priority. The Result screen displays a "Using local analysis" notice so the user knows the AI engine was bypassed. The recommendation is still fully functional.
- **ElevenLabs unavailable:** If the `voice-briefing` edge function returns an error (API key missing, ElevenLabs API failure, or network error), the "Hear Briefing" button shows an error or unavailable state. The rest of the app — including the full text recommendation — remains fully usable. The user can still read the complete decision on screen.
- **Supabase unavailable:** If the Supabase client cannot be initialized (missing env vars) or the database query fails, the app falls back to a built-in local tool dataset (`src/data/aiTools.ts`). Saved decisions fall back to in-memory React state if the database insert fails.

---

## External Libraries and Frameworks

All third-party dependencies are listed in `package.json`. The following are the significant ones actually used in the source code:

| Library | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | React DOM renderer |
| `@supabase/supabase-js` | ^2.57.4 | Supabase client (database queries, edge function calls) |
| `lucide-react` | ^0.446.0 | Icon library |
| `typescript` | ^5.5.3 | Type system (dev) |
| `vite` | ^5.4.2 | Build tool and dev server (dev) |
| `tailwindcss` | ^3.4.1 | Utility-first CSS framework (dev) |
| `autoprefixer` | ^10.4.18 | CSS vendor prefix automation (dev) |
| `postcss` | ^10.4.35 | CSS processing (dev) |
| `eslint` | ^9.9.1 | Linter (dev) |

No other UI component libraries, state management libraries, routing libraries, or animation libraries are used. The redaction engine, decision scoring algorithm, session management, and all UI components are custom code written for this project.

---

## External Services and APIs

| Service | Role | Used From |
|---|---|---|
| **Google Gemini API** | AI reasoning over structured tool data to produce a recommendation | Supabase Edge Function (`gemini-decision`) — server-side only |
| **ElevenLabs API** | Text-to-speech voice briefing from the safe decision summary | Supabase Edge Function (`voice-briefing`) — server-side only |
| **Supabase** | PostgreSQL database (tool reference data, saved decisions), Edge Functions runtime, and auth-adjacent session management | Client (anon key, read + insert) and server (edge functions) |

---

## Security

- **API keys are server-side Edge Function secrets.** The `GEMINI_API_KEY` and `ELEVENLABS_API_KEY` are stored as Supabase Edge Function secrets and are only accessed via `Deno.env.get()` inside the edge function runtime. They are never present in client-side code, environment variables exposed to the browser, or the production build bundle.
- **Client-side keys.** Only the Supabase anon public key is used in the browser, which is safe by design (read access to `ai_tools`, insert access to `saved_decisions` scoped by RLS policies).
- **Row Level Security.** Both database tables have RLS enabled. `ai_tools` is read-only (public SELECT). `saved_decisions` allows anon INSERT and SELECT (keyed by `session_id`). No client-side UPDATE or DELETE is permitted.
- **No user authentication.** The app uses an anonymous session model — a UUID generated and stored in `localStorage`. No login, no passwords, no OAuth.
- **CORS.** Both edge functions return the required CORS headers on every response (preflight, success, and error) to ensure Supabase client compatibility.

---

## Local Development / Setup

### Prerequisites

- Node.js 18+
- npm

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following placeholders (replace with your own values):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The following secrets are configured server-side as Supabase Edge Function secrets (never in `.env` or client code):

- `GEMINI_API_KEY` — Google Gemini API key for the decision engine
- `ELEVENLABS_API_KEY` — ElevenLabs API key for voice briefings

### Database Setup

Run the migration in `supabase/migrations/` to create the `ai_tools` and `saved_decisions` tables with RLS policies. Seed the `ai_tools` table with tool data (id, name, description, category, pricing, privacy, task fit scores, URLs).

### Run the Dev Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

---

## Hackathon Note

Built for **ShellHacks 2026** during the event hacking period. All code, design, and architecture in this repository was created for the hackathon submission.
