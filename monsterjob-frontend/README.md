# MonsterJob Frontend

React + Phaser.js frontend for MonsterJob. This first milestone proves the
full stack connects end to end: React UI ↔ your Express/MongoDB backend ↔ a
Phaser canvas rendering real data from your database.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure the API URL**
   ```bash
   cp .env.example .env
   ```
   Default is `http://localhost:5000` - change this if your backend runs elsewhere.

3. **Make sure your backend is running** (`monsterjob-backend`, `npm run dev`) and has been seeded:
   ```bash
   node seed/seedSpecies.js
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`.

## What's implemented so far

- **Auth flow**: Register → Login → session persists across page refresh (token stored in `localStorage`, restored via `/api/auth/me` on load)
- **Protected routing**: `react-router-dom` redirects to `/login` if you're not authenticated
- **Office page**: lists your creatures (from `GET /api/creatures`), lets you catch a new one from the full species list (`GET /api/creatures/species` → `POST /api/creatures`)
- **Job assignment**: pick an idle creature (one not already working), see only the jobs it actually qualifies for (`GET /api/jobs/recommendations/:creatureId`, driven by your backend's effective-stats calculation), assign it, watch a live countdown, and collect the payout once it's done - or cancel early
- **Equipment**: browse the shop (`GET /api/equipment`), buy items, and equip/unequip them per-slot on any creature. The equip dropdowns are pre-filtered by slot type client-side (so you can't even try to put a Body item in the Head slot), but the backend still enforces it too
- **Office**: view current tier stats (capacity, job slots, equipment slots, unlocked features), start an upgrade (charges money, shows a live real-time countdown), finalize once ready, or cancel mid-upgrade
- **Achievements**: shows the full catalog with locked/unlocked status, refreshes automatically after catching a creature or completing a job (since your backend auto-checks achievements after those actions), with a manual "Check" button as a fallback for anything not covered by an automatic trigger
- **Offline earnings**: checks once per page load (not repeatedly) whether any creature was working while you were away, and if so, shows a "Welcome back!" modal with total money/XP earned and a per-creature breakdown - silently does nothing if there's nothing to report
- **Phaser canvas**: renders inside the React page (not a separate window) — draws one colored tile per creature you own, color-coded by type (Fire=red, Water=blue, Nature=green, etc.), with a gentle idle bob animation
- **Money display stays live**: the header's money/XP refreshes after any action that changes it (job completion, cancellation) via a `refreshUser()` call in `AuthContext`, not just at login

## How the Phaser ↔ React integration works

This is usually the trickiest part of this kind of project, so it's worth understanding `src/game/PhaserGame.jsx` specifically:

- Phaser wants to own a persistent `<canvas>` and run its own game loop independently
- React wants to re-render your UI whenever state changes
- The pattern used here: create the Phaser `Game` instance **once** on mount (stored in a `useRef`, not React state, so updating it doesn't trigger a re-render), and destroy it on unmount
- Data flows from React into Phaser via `game.registry.set('creatures', creatures)` - whenever the creatures list changes, we push the new data into the registry and restart the `BootScene` so it redraws with fresh data

This means React and Phaser talk to each other through the registry, not through React re-rendering the canvas element itself (which would fight with Phaser's own rendering).

## Testing the flow

1. Go to `/register`, create an account
2. You should land on the Office page — empty creature list, a Phaser canvas saying "No creatures yet"
3. Pick a species from the dropdown (populated from your seeded 24 species), click **Catch**
4. The sidebar list updates, AND the Phaser canvas redraws showing a colored tile with your creature's nickname bobbing gently
5. Refresh the page — you should stay logged in (session restored from the stored token) and still see your creature
6. In the new **Assign a Job** panel, pick that creature from the dropdown — you should see only jobs it actually qualifies for (a level-1 common creature will see very few jobs; this is correct, not a bug - it's your backend's real eligibility check)
7. Click **Assign** on one → it moves into **Active Assignments** with a live countdown
8. The creature you just assigned should disappear from the "idle creature" dropdown (since it's now working) - confirms `currentJob` is being respected
9. Wait for the countdown to hit `Ready!`, click **Collect** → your money in the top-right header should visibly increase
10. Try **Cancel** on a different in-progress assignment → confirms it resolves without a payout
11. In the **Equipment Shop** panel, click **Buy** on the Iron Helmet (50 money) → confirm the header's money drops by 50
12. Select a creature, choose the Iron Helmet in the Head slot dropdown, click **Equip** → the slot label above should update to show "head - Iron Helmet"
13. Go back to **Assign a Job** and re-check that creature's recommendations - if it's now near a job's stat threshold, the equipped bonus might unlock a job it couldn't reach before
14. Click **Remove** on the equipped item → confirms unequip works and the slot goes back to "empty"
15. In the **Office** panel, click **Upgrade to Tier 2** → confirms money drops by the tier's cost and a countdown starts
16. Try clicking the disabled "Not ready yet" button - it should stay disabled until the countdown hits zero, at which point it becomes **Finalize Upgrade**
17. Click **Finalize Upgrade** once ready → confirms tier, capacity, and job slots all update in the panel
18. Start another upgrade and click **Cancel** instead of waiting it out → confirms it resets without finalizing (no refund, matching the backend's documented behavior)
19. Catch creatures until you have 10 → check the **Achievements** panel - "Team Builder" should flip to unlocked (🏆 with a gold border and "✓ UNLOCKED" badge) automatically, no manual action needed, and your money should tick up by its reward
20. If an achievement seems like it should be unlocked but isn't showing yet, click its **Check** button - this calls the manual check endpoint directly as a fallback
21. Assign a creature to a short job, then in MongoDB Atlas set your `users` document's `lastLoginTime` back a few hours (same trick as backend testing)
22. Refresh the page (or log out and back in) → the "Welcome back!" modal should appear automatically showing what you earned, with a per-creature breakdown
23. Refresh again immediately → the modal should NOT reappear (nothing new to report since `lastLoginTime` was already reset by the first check)

## Known placeholders / what's NOT built yet

- **No real sprites** — creatures are colored rectangles, not pixel art. Swapping these for real sprite sheets means loading them in a Phaser `preload()` (not built yet, since there's no art) and replacing the `add.rectangle` calls in `BootScene.js` with `add.sprite`
- **Only one scene** — the design doc calls for 8 scenes (BootScene, MenuScene, GameScene, OfficeScene, JobScene, CreatureDetailScene, EquipmentScene, AchievementsScene). This milestone only has `BootScene`, doing double duty as a placeholder "office view". Job assignment, equipment, office upgrades, achievements, and the offline-earnings summary all live entirely in React, not Phaser - deliberate for now (forms/modals are much easier in React than in a canvas), but some of this eventually belongs in Phaser (a visibly upgraded office background per tier, creatures wearing their gear, etc.)
- **Inventory is now real** - the equip dropdowns only show items you've actually purchased (with an owned-quantity count next to each), and the shop list shows "x2" etc. next to anything you already own. Equip/unequip correctly consume and return copies
- **Office capacity/job-slot limits aren't visibly enforced in the Catch/Assign UI** - if you hit the limit, you'll see the backend's error message in the error banner, but there's no proactive "you're at capacity" indicator before you try
- **Offline earnings only checks once per page load** - if you leave the tab open for hours without refreshing, it won't proactively pop up; you'd need to refresh or re-log for it to check again
- **Styling is a first pass** — pixel-font display type + warm wood/parchment palette (deliberately not a generic dark-mode SaaS look), but there's no tilemap, no real office background art, just solid colors and CSS panels

## Next steps

- Load real sprite sheets once art exists, replace the colored-rectangle placeholders
- Move some of the job-assignment/equipment/office feedback into Phaser itself (e.g. a creature's tile could visibly change color/style when wearing gear, or the office background could visibly upgrade per tier)
- Surface office capacity/job-slot limits proactively in the Catch/Assign UI (e.g. disable the Catch button and show "office full" instead of only finding out after a failed request)
- Every backend route category from the original spec now has a working frontend screen, including offline earnings - what's left is genuinely visual/UX polish, not missing functionality
