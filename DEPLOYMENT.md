# Deploy (Render + Vercel)

## Opcao A (recomendado): Render (fullstack em 1 servico)

O `npm run build` gera:
- `dist/public` (frontend)
- `dist/index.cjs` (server Express)

E o `npm run start` serve tudo em uma unica porta (`PORT` do ambiente).

### Render

- Use o blueprint `render.yaml` na raiz do repo (Deploy via Blueprint).
- Este repo inclui `.npmrc` com `include=dev` para garantir que o build funcione mesmo quando o Render usa `npm install` com `NODE_ENV=production` (precisa de `tsx/vite/esbuild` no build).
- Configure as variaveis de ambiente no servico:
  - `DATABASE_URL` (Postgres)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `SESSION_SECRET`
  - (opcional) `OPENAI_MODEL`, `OPENAI_FALLBACK_MODEL`
  - (opcional) OAuth: `GOOGLE_*` / `APPLE_*`

## Opcao B: Vercel (frontend) + Render (API)

O frontend usa URLs relativas `/api/*`. Para isso funcionar com backend separado, configure rewrite no Vercel.

### Render (API)

- Crie o servico Web no Render com:
  - Build: `npm ci --include=dev && npm run build`
  - Start: `npm run start`
- Configure as envs do backend (mesmas do Render acima).

### Vercel (frontend)

- Configure o projeto apontando para a raiz do repo.
- (recomendado) Build Command: `npm run vercel-build`
- (se faltar dependencias no build) Install Command: `npm ci --include=dev`
- Output Directory: `dist/public`
- Ajuste `vercel.json` substituindo `YOUR-RENDER-SERVICE` pela URL real do seu servico no Render.
- Configure envs no Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
