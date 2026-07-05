# Bhansar CRM Backend

Express + TypeScript + MongoDB backend for Bhansar CRM.

## Run

```bash
npm install
npm run build
npm start
```

For development:

```bash
npm run dev
```

## Environment

Set these variables in Railway:

```bash
PORT=5001
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/bhansar_crm?retryWrites=true&w=majority
JWT_SECRET=use-a-long-random-secret
JWT_REFRESH_SECRET=use-another-long-random-secret
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
CLIENT_URL=https://your-frontend.vercel.app
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

`CLIENT_URL` is the frontend URL allowed by CORS. For local development use `http://localhost:5173`.
