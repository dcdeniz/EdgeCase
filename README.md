# EdgeCase

Hackathon-ready Next.js App Router + Supabase Edge Functions/Postgres foundation, hosted on Vercel and instrumented with NEAT.

```bash
npm install
npm run hooks:install
npm run supabase:start
cp .env.example .env.local
npm run dev
```

Put the local keys printed by `supabase status` in `.env.local`. Web health is `/api/health`; Edge health is `http://127.0.0.1:55321/functions/v1/health`. EdgeCase uses the 553xx local port range so it can run beside Newdryve.

Read [`docs/knowledge-base/manifest.json`](docs/knowledge-base/manifest.json) before development. Canonical contracts and decisions live in [`docs/project/`](docs/project/README.md).

Run `npm run check`, `npm run build`, and optionally `npm run docs:watch`.
