# Deploy (Render + Vercel)

## Opção A (recomendado): Render (fullstack em 1 serviço)

O `npm run build` gera:
- `dist/public` (frontend)
- `dist/index.cjs` (server Express)

E o `npm run start` serve tudo em uma única porta (`PORT` do ambiente).

### Render

- Use o blueprint `render.yaml` na raiz do repo (Deploy via Blueprint).
- Configure as variáveis de ambiente no serviço:
  - `DATABASE_URL` (Postgres)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `SESSION_SECRET`
  - (opcional) `OPENAI_MODEL`, `OPENAI_FALLBACK_MODEL`
  - (opcional) OAuth: `GOOGLE_*` / `APPLE_*`

## Opção B: Vercel (frontend) + Render (API)

O frontend usa URLs relativas `/api/*`. Para isso funcionar com backend separado, configure rewrite no Vercel.

### Render (API)

- Crie o serviço Web no Render com:
  - Build: `npm ci && npm run build`
  - Start: `npm run start`
- Configure as envs do backend (mesmas do Render acima).

### Vercel (frontend)

- Configure o projeto apontando para a raiz do repo.
- Build Command: `npm run build`
- Output Directory: `dist/public`
- Ajuste `vercel.json` substituindo `YOUR-RENDER-SERVICE` pela URL real do seu serviço no Render.

