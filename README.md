# CEAC OS

Independent CEAC operating-system web application.

## Run
1. `npm ci`
2. `npm run dev`

## Production build
`npm run build`

Vercel is configured by `vercel.json` as a Vite SPA and serves `dist/`.

## Architecture boundary
- GitHub: application source of truth
- Vercel: current web host only; replaceable
- Supabase: CEAC database/auth backend
- Coach Jem: separate application and must not be used as CEAC OS source or deployment target

Do not place a Supabase service-role key in this client application.
