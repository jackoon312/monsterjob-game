# Deploying the MonsterJob Frontend (Vercel)

Your frontend already reads the backend URL from an environment variable (`VITE_API_URL` in `src/api/client.js`), so it's ready to point at a deployed backend instead of `localhost:5000` without any code changes.

## Prerequisites

- Your backend already deployed (see the backend's own `DEPLOYMENT.md`) - you need its live URL first
- A GitHub repo containing this frontend
- A free Vercel account (vercel.com)

## Step-by-step

1. **Push your frontend to GitHub** if it isn't there yet:
   ```bash
   cd monsterjob-frontend
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/monsterjob-frontend.git
   git push -u origin main
   ```
   `.gitignore` already excludes `node_modules/`, `dist/`, and `.env`.

2. **Go to vercel.com, sign in, click "Add New..." → "Project"**

3. **Import your `monsterjob-frontend` GitHub repo** — Vercel auto-detects it's a Vite project and fills in sensible defaults (Build Command: `vite build`, Output Directory: `dist`). You shouldn't need to change these.

4. **Add an environment variable** before deploying (there's a section for this on the same import screen, or under Settings → Environment Variables after):
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | your deployed backend's URL, e.g. `https://monsterjob-backend.onrender.com` (no trailing slash) |

5. **Click "Deploy"** — Vercel builds and deploys, usually in under a minute.

6. **Copy your live frontend URL** — something like `https://monsterjob-frontend.vercel.app`

7. **Go back to your backend's Render dashboard** and set `CLIENT_URL` to this exact URL, then redeploy the backend so CORS allows requests from your live frontend.

8. **Test it end to end:** open your Vercel URL, register a new account, catch a creature, assign a job. If anything fails, open DevTools → Network tab and check what's actually failing (see Common Issues below).

## Re-seeding note

If this is a fresh deploy pointing at a fresh/different database than what you tested locally with, make sure you've run the backend's seed scripts (`seedSpecies.js`, `seedJobs.js`, `seedEquipment.js`) against that same database, or your live site's "Catch a Creature" dropdown and "Equipment Shop" will be empty.

## Common issues

- **Blank page or console errors about `undefined` API calls** → confirm `VITE_API_URL` was actually set in Vercel's environment variables *before* the build ran. Vite bakes env vars in at build time, not runtime — if you add/change it after deploying, you need to trigger a new deployment (Vercel dashboard → Deployments → "..." → Redeploy) for it to take effect.
- **CORS errors in the browser console** → your backend's `CLIENT_URL` doesn't match your Vercel URL exactly. Double-check for `https://` vs `http://`, trailing slashes, or a `www.` mismatch.
- **Login works but immediately logs you out on refresh** → check that your backend is actually reachable from the deployed frontend (open `<your-backend-url>/api/health` directly in a browser tab to confirm the backend itself is up).
- **First request is very slow** → if you're using Render's free tier for the backend, this is the 30-60 second cold-start after inactivity, not a frontend bug.

## What you'll have after this

A real, shareable URL you can put in a resume, portfolio, or send to a recruiter — e.g. `https://monsterjob-frontend.vercel.app` — backed by a live database with your full 24-creature, 53-job, 15-equipment-item content, running the complete gameplay loop end to end.
