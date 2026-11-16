# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

MonsterJob is an idle creature-management game (catch creatures, assign them to timed jobs, earn money/XP, buy equipment, upgrade the office). Two independent npm projects live side by side — there is no root workspace; run npm commands inside each directory:

- `monsterjob-backend/` — Express 4 + Mongoose 8 REST API (CommonJS)
- `monsterjob-frontend/` — React 18 + Vite 5 + Phaser 3 client (ES modules)

`monsterjob-backend.zip` / `monsterjob-frontend.zip` at the root are committed snapshots of the two directories, not sources — edit the directories. The root `package-lock.json` is an empty stub.

## Commands

Backend (`cd monsterjob-backend`):

```bash
npm install
cp .env.example .env      # needs MONGO_URI and JWT_SECRET; CLIENT_URL is the CORS origin
npm run dev               # nodemon, http://localhost:5000
npm start                 # plain node
node seed/seedSpecies.js  # 24 species
node seed/seedJobs.js     # 53 jobs
node seed/seedEquipment.js# 15 items
curl http://localhost:5000/api/health
```

Seed scripts upsert by name, so they are safe to re-run. The frontend's catch dropdown, job lists, and shop are empty until the database is seeded.

Frontend (`cd monsterjob-frontend`):

```bash
npm install
cp .env.example .env      # VITE_API_URL, defaults to http://localhost:5000
npm run dev               # http://localhost:5173
npm run build
npm run preview
```

There are no tests, linter, or formatter configured in either project. API verification is manual: curl recipes per feature are in `monsterjob-backend/README.md`, and a Postman collection + environment is in `monsterjob-backend/postman/`. A step-by-step UI walkthrough is in `monsterjob-frontend/README.md`.

A real MongoDB instance is required (the READMEs assume Atlas); `config/db.js` calls `process.exit(1)` if the connection fails, so the server will not start without a reachable `MONGO_URI`.

## Backend architecture

`server.js` mounts one router per feature under `/api/*`; each `routes/X.js` is a thin mapping to `controllers/XController.js`, and every route except register/login/health goes through `middleware/auth.js` `protect` (Bearer JWT → `req.user`). Note `routes/offline.js` is mounted at `/api/game`. Socket.io is initialised but only logs connections.

Controllers follow one convention: `async (req, res)` with a try/catch that returns `res.status(...).json({ message, ... })`; success payloads are wrapped in a named key (`{ creatures }`, `{ assignment }`, `{ office }`), which the frontend `src/api/*` modules destructure.

Game rules that span multiple files:

- **Money has two ledgers.** `User.totalMoney` is the spendable balance (equipment purchases, office upgrades, achievement rewards). `Creature.totalEarnings` is stat history only. Anything that pays out must credit both.
- **Creature busy-lock.** `Creature.currentJob` holds the active `JobAssignment` id. Creating an assignment sets it; completing, failing, cancelling, and offline resolution must all clear it.
- **Time is resolved lazily on request, never by a background worker.** A job finishes only when the client calls `PUT /api/assignments/:id` after `endTime`; an office upgrade finishes only when `finalizeIfReady` runs (`utils/officeHelpers.js`) on a later office request. Durations are stamped at start, so changing config afterwards does not shorten in-flight timers.
- **Effective stats.** Job eligibility and recommendations use `utils/effectiveStats.js` (base stats × summed equipment percent bonuses), not raw `creature.stats`. The creature must have `equipment.head/body/accessory` populated before calling it.
- **Office limits.** `getOrCreateOffice` lazily creates a tier-1 office; `catchCreature` enforces `creatureCapacity` and `createAssignment` enforces `jobSlots`. The tier table (capacity, cost, hours, feature unlocks at tiers 5/10/15/20) is static in `config/officeTiers.js` and copied onto the `OfficeUpgrade` document on finalize.
- **Inventory.** Purchasing increments an `Inventory` doc (one per user+item, counting unequipped copies); equipping consumes a copy and unequipping/swapping returns it. Any new source of items must `$inc` Inventory the same way.
- **Achievements** are a static in-code catalog (`ACHIEVEMENT_CATALOG` in `achievementController.js`), each with a `check` function; the `Achievement` model only stores unlocks. Other controllers call the exported `attemptUnlockMany` after relevant actions (catch → `team_builder`/`legendary_hunter`; job payout → `first_steps`/`wealthy`/`job_master`) inside their own try/catch so a failed check never fails the main request.
- **Offline earnings** (`offlineController.js`) owns `User.lastLoginTime` exclusively — `login` must not touch it. It simulates repeated cycles of each in-progress job for elapsed time capped at 8 hours, deliberately ignores `riskFactor`, then resolves the assignment.
- **Duplicated XP/level logic.** `DIFFICULTY_MULTIPLIER`, `calculateXPReward`, and the level-up loop (threshold ×1.15 per level, cap 100) are copy-pasted in `assignmentController.js` and `offlineController.js`; change both together.
- Energy is deducted on assignment and never regenerated anywhere in the code.
- `GameSave` (cloud save) stores an unvalidated client-supplied `gameState` blob and is not derived from the live models.

## Frontend architecture

- `src/api/client.js` is the single axios instance: it attaches the token from `localStorage` (`monsterjob_token`) and clears it on any 401. `src/api/*.js` are one-function-per-endpoint wrappers returning `response.data`.
- `AuthContext` holds the user snapshot. Money/XP in the header only update when `refreshUser()` is called, so any action that changes them must call it.
- There is a single authenticated page, `pages/OfficePage.jsx`, which owns the shared state (creatures, office, active assignments, job catalog, achievements) and passes change callbacks to the panels in `components/`. Panels fetch their own data too; cross-panel refresh is done via those callbacks and a `refreshSignal` counter.
- Countdown timers (`JobsPanel`, `OfficePanel`) are client-side 1s ticks against server-provided end times; the client then calls the backend to actually resolve them (see lazy time resolution above). `OfflineEarningsModal` calls the offline endpoint once per page load.

### React ↔ Phaser bridge

`src/game/PhaserGame.jsx` creates the `Phaser.Game` once in a ref and never re-renders the canvas. React pushes data in through `game.registry` (`officeIdle`, `officeByCategory`, `officeJobsByCategory`, `officeTier`, achievement counts) and restarts whichever scene is active; `OfficeRoomScene` must be restarted with its `category` re-passed. `OfficePage` memoizes `officeData` specifically so unrelated re-renders don't restart the scene — keep new inputs to it memoized.

Scenes (`src/game/scenes/`): `MenuScene` (title) → `BootScene` (the Main Office: idle creatures plus five doors) → `OfficeRoomScene` (one reusable scene for the Labor/Service/Creative/Craft/Combat rooms, showing creatures working jobs in that category). Shared drawing and layout code lives in `src/game/creatureRenderer.js`. There are no art assets: creatures are procedural shapes keyed by type and rarity, and the `spriteAssetPath`/`icon` fields in seed data point to files that do not exist.

The frontend README's description of the Phaser side (single scene, `registry.set('creatures', ...)`, colored rectangles) is out of date; trust the code.

## Deployment

`monsterjob-frontend/DEPLOYMENT.md` describes Vercel for the frontend and Render for the backend. `VITE_API_URL` is baked in at build time, and the backend's `CLIENT_URL` must exactly match the deployed frontend origin for CORS.

## MonsterJob rules
- Stack: React + Vite + Phaser 3 frontend (monsterjob-frontend), Node/Express/Mongoose backend (monsterjob-backend).
- Art direction: 2D top-down pixel art, cute/chibi, Stardew Valley-inspired. All art is original and drawn by code in art-src/. No Pokemon/Palworld resemblance, no downloaded assets.
- Sprites go in monsterjob-frontend/public/assets/. Paths must match spriteAssetPath in monsterjob-backend/seed/seedSpecies.js.
- Keep art generator scripts in art-src/ so the art is reproducible.
- Never commit .env files. Always run npm run build in the frontend after changes.
- Never work directly on main. Stay on the current session branch and commit after each finished piece.
- Existing gameplay (jobs, equipment, offices, achievements) must keep working.
