# LinkIntel — LinkedIn Network Intelligence

Upload your LinkedIn data export and get network analytics, a force-directed
graph, transition insights, and an AI advisor that knows your network by name.

Built for people in transition — military to civilian, career change, or anyone
whose next move depends on who they already know.

## Privacy — read this before you upload

LinkIntel has two halves, and they behave differently. The difference matters,
because your export contains other people's names and email addresses.

**Stays in your browser.** Parsing the ZIP, the network graph, the briefing,
the analytics, the transition intel. No upload, no server, no database, no
analytics. Close the tab and it is gone — the data lives in React state, never
on disk.

**Leaves your browser.** The **AI Advisor** and **post generator** send your
profile, career history, skills, and your connections' **names, job titles and
employers** (up to 500) to the OpenAI API, so the advisor can give advice that
names specific people. That is the whole point of it, and it cannot work any
other way.

- **Email addresses are never sent.** They add nothing to career advice and are
  the most sensitive field in the export.
- The advisor **asks before its first call** and remembers your answer. Decline
  and everything else still works.
- Requests go through this app's own API routes, so your OpenAI key stays on the
  server and never reaches the browser.
- Your connections did not agree to any of this. Use the advisor with that in
  mind, and bear in mind that if you are in the EU or UK, their data is still
  their data.

If you want the analytics with nothing leaving your machine at all, run it
without `OPENAI_API_KEY` and skip the advisor. Everything else works.

## Quick Start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

The advisor needs an OpenAI key. Without one, every other page works:

```bash
echo "OPENAI_API_KEY=sk-..." > .env.local
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Add `OPENAI_API_KEY` in the project's environment variables — only if you
   want the advisor
4. Deploy

## How It Works

1. **Upload** your LinkedIn ZIP (`Connections.csv` required, the rest optional)
2. **Briefing** — top companies, industries, connections by year, strong ties
3. **Network** — D3 force-directed graph with zoom, pan and filtering
4. **Intel** — military vs civilian split, recruiters, target companies
5. **Actions** — recommendations with copyable outreach templates
6. **Advisor** — AI chat over your network *(sends data to OpenAI — see Privacy)*

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14+ | App Router, TypeScript |
| TailwindCSS | Styling |
| JSZip | ZIP extraction |
| PapaParse | CSV parsing |
| D3.js | Force-directed network graph |
| Recharts | Bar charts |
| Lucide React | Icons |
| OpenAI (`gpt-4o-mini`) | AI advisor — optional |

## Project Structure

```
src/
├── app/
│   ├── upload/      → File upload
│   ├── briefing/    → Stats and charts
│   ├── network/     → D3 graph
│   ├── intel/       → Transition intelligence
│   ├── actions/     → Recommendations
│   ├── advisor/     → AI chat
│   └── api/
│       ├── chat/    → OpenAI proxy, keeps the key server-side
│       └── post/    → Post generator
├── components/
└── lib/
    ├── advisorEngine.ts  → builds the prompt sent to OpenAI
    ├── openaiClient.ts   → the consent gate both AI paths pass through
    ├── zipParser.ts
    ├── csvParser.ts
    ├── networkBuilder.ts
    ├── insightEngine.ts
    └── store.tsx
```

## Getting your LinkedIn export

LinkedIn → Settings → Data Privacy → Get a copy of your data → select
**Connections** (and optionally Messages) → download the ZIP.

It usually arrives by email within ten minutes.

## Licence

MIT
