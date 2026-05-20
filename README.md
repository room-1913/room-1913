# Room 1913

A minimal, atmospheric web prototype: a midnight European study where you can speak with Jung, Freud, Adler, and Lacan.

## Local

```bash
npm install
cp .env.local.example .env.local   # then paste your real ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. `npm i -g vercel` (or use the dashboard).
2. Push this folder to a Git repo, then import it at vercel.com/new.
3. In the Vercel project's **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key from console.anthropic.com
4. Deploy.

The API key is only ever read on the server in `app/api/chat/route.ts` — it is never sent to the browser.
