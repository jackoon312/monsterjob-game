# MonsterJob Backend

MERN backend for MonsterJob, an idle creature-management game.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   - `MONGO_URI`: your MongoDB connection string (use MongoDB Atlas free tier if you don't have one)
   - `JWT_SECRET`: any long random string (e.g. generate one with `openssl rand -base64 32`)

3. **Run the server**
   ```bash
   npm run dev
   ```
   Server starts on `http://localhost:5000` by default.

4. **Test it's working**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return `{"status":"ok","message":"MonsterJob API is running"}`

## What's implemented so far

- All 9 Mongoose models (User, Creature, CreatureSpecies, Job, JobAssignment, Equipment, OfficeUpgrade, Achievement, GameSave)
- JWT authentication: register, login, logout, get current user (`/api/auth/*`)
- Auth middleware (`protect`) to guard private routes
- Creature CRUD (`/api/creatures/*`): list species, catch, list mine, get one, update (rename/favorite), release
- Job CRUD + recommendations (`/api/jobs/*`): list, get one, create, update, delete, and get recommended jobs for a creature based on its stats
- Job assignments (`/api/assignments/*`): assign a creature to a job (validates stats + energy, deducts energy, locks the creature), list active assignments, complete/resolve a finished job (pays out money + XP, handles level-ups, applies risk-based failure), cancel an in-progress job
- Equipment (`/api/equipment/*` + `/api/creatures/:id/equipment*`): browse the shop, purchase (deducts money, adds to your real `Inventory`), view your inventory, and equip/unequip items into a creature's head/body/accessory slots (checks item type matches the slot, the creature meets the level requirement, AND that you actually own an unequipped copy)
- Office upgrades (`/api/office/*`): auto-creates a tier-1 office on first request, starts a real-time upgrade (charges money, takes `timeRequiredHours`), reports live progress, finalizes automatically once the timer's up, and can be cancelled mid-upgrade (no refund) - unlocking Equipment/Crafting/Boss Battles/Prestige at tiers 5/10/15/20
- Achievements (`/api/achievements/*`): a static catalog of 5 starter achievements (First Steps, Wealthy, Job Master, Team Builder, Legendary Hunter), each with a `check` function; calling the check endpoint unlocks it and pays out the money reward if requirements are met
- User profile, statistics, and cloud save (`/api/user/*`): view/edit profile (username/email only), aggregated statistics across all your creatures, and a cloud save that stores/restores a full game-state snapshot
- Offline earnings (`/api/game/*`): server time endpoint (anti-cheat clock source) and offline earnings calculation - simulates a creature's assigned job auto-repeating for up to 8 real hours based on time since last login, pays out, and resolves the assignment
- Seed scripts for starter creature species, jobs, and equipment
- Socket.io wired up (for future real-time features)
- Global error handling + 404 handler

## Bug fix this round: job completions weren't crediting real money

Previously, completing a job assignment (`checkAndCompleteAssignment`) only updated `creature.totalEarnings` — a stats/history field — but never actually added the payout to `user.totalMoney`, which is what equipment purchases and office upgrades actually check against. This has been fixed: completing a job now also does `User.findByIdAndUpdate(..., { $inc: { totalMoney, totalXP } })`. If you tested job completions before this fix, your creatures' `totalEarnings` stat may be higher than your actual spendable `totalMoney` — that's the bug's fingerprint, not a new issue.

## Bug fix this round: login was conflicting with offline earnings

`login` used to stamp `user.lastLoginTime = new Date()` on every call. But offline-earnings measures elapsed time *since* `lastLoginTime` to figure out how long you were away — and a client has to call `login` to get a fresh token whenever the old one expires. That meant the moment you logged back in, the very thing offline-earnings needed to measure got wiped out before it could read it. `lastLoginTime` is now owned exclusively by the offline-earnings endpoint (it sets it to "now" only after it finishes calculating a payout) - `login` no longer touches it at all.

## Integration gaps closed this round

Three things flagged in earlier "Next steps" are now wired up:

1. **Equipment bonuses now affect job eligibility.** A new `utils/effectiveStats.js` computes a creature's effective stats (base stats + equipped item bonus percentages, summed across head/body/accessory). `jobController.js`'s recommendations and `assignmentController.js`'s eligibility check both use this now instead of raw `creature.stats`.

2. **Office limits are enforced.** A new `utils/officeHelpers.js` holds the shared `getOrCreateOffice` logic (previously duplicated only in `officeController.js`). `catchCreature` now checks the office's `creatureCapacity` before allowing a new creature, and `createAssignment` checks `jobSlots` before allowing a new assignment - both return a clear 400 if the office is at its limit.

3. **Achievements now auto-check themselves.** `achievementController.js` now exports `attemptUnlock`/`attemptUnlockMany` alongside the HTTP handler, so other controllers can trigger checks without a separate API call. Catching a creature auto-checks `team_builder`/`legendary_hunter`; completing a job (both the normal endpoint and offline earnings) auto-checks `first_steps`/`wealthy`/`job_master`. The manual `POST /api/achievements/:id/check` endpoint still works too, for anything not covered by an automatic trigger.

## Seeding starter data

```bash
node seed/seedSpecies.js
node seed/seedJobs.js
node seed/seedEquipment.js
```
All three scripts upsert by name, so it's safe to re-run any time.

**`seed/seedSpecies.js`** now has all 24 creatures from your original archetype list (Common through Legendary), with stats scaled by rarity (~3x from Common to Legendary) and each creature's "primary stat" (matching its flavor - e.g. Phoenixreborn is strength-heavy, Chronodepths is intelligence-heavy) boosted ~25% above its tier's baseline.

**`seed/seedJobs.js`** now has 53 jobs (comfortably past the 50+ target) spread across all 5 categories (Labor, Service, Creative, Craft, Combat) and all 4 difficulty tiers, with `minimumLevel` gates ranging from 1 up to 18 - so there's real level-gated progression instead of everything being reachable immediately.

**`seed/seedEquipment.js`** now has 15 items - one per (slot x rarity) combination, giving full Head/Body/Accessory coverage at every rarity from Common through Legendary. Level requirements (1/3/7/12/18) mirror the same progression curve as the jobs.

Every entry across all three files was validated against the actual Mongoose schemas (enum values, required fields) before being finalized - 24 species, 53 jobs, and 15 equipment items all pass validation with zero errors, and there are no duplicate names within any list.

## Testing the job endpoints

All job routes require the `Authorization: Bearer <token>` header.

**List all jobs (optionally filter):**
```bash
curl "http://localhost:5000/api/jobs?category=Labor" \
  -H "Authorization: Bearer <token>"
```

**Get job recommendations for a creature:**
```bash
curl http://localhost:5000/api/jobs/recommendations/<creature_id> \
  -H "Authorization: Bearer <token>"
```
Returns only jobs the creature currently qualifies for (level, stats, and energy all meet the minimums), ranked by how far its stats exceed the requirements.

## Testing the full assign-to-job flow

**1. Assign a creature to a job:**
```bash
curl -X POST http://localhost:5000/api/assignments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"creatureId":"<creature_id>","jobId":"<job_id>"}'
```
This checks the creature qualifies (level/stats/energy), deducts the job's energy cost, and locks the creature (`currentJob` gets set) so it can't be double-assigned. The response includes the `endTime` — that's when the job finishes.

**2. Check active assignments:**
```bash
curl http://localhost:5000/api/assignments \
  -H "Authorization: Bearer <token>"
```

**3. Try to complete it before `endTime`** — you'll get a 400 with `secondsRemaining` telling you how much longer to wait. Once `endTime` has passed:
```bash
curl -X PUT http://localhost:5000/api/assignments/<assignment_id> \
  -H "Authorization: Bearer <token>"
```
This rolls the job's `riskFactor` — on success it pays out money + XP (with automatic level-ups if XP crosses the threshold) and frees the creature; on failure, no payout, but the creature is still freed. In your frontend, you'd call this endpoint once your local timer shows the job's `durationMinutes` have elapsed (or just poll periodically).

**4. Cancel early (optional):**
```bash
curl -X DELETE http://localhost:5000/api/assignments/<assignment_id> \
  -H "Authorization: Bearer <token>"
```
Marks it Failed with no payout and frees the creature. Energy spent is NOT refunded — that's the cost of committing to a job.

> Tip for testing without waiting the full duration: temporarily lower a seeded job's `durationMinutes` to something like `1` (1 minute) via the "Update Job" endpoint, or edit it directly in your database, so you don't have to wait 15-25 minutes to see completion work.

## Testing the equipment flow

**1. Browse the shop:**
```bash
curl http://localhost:5000/api/equipment \
  -H "Authorization: Bearer <token>"
```

**2. Try equipping something you haven't bought yet** - confirm this now correctly fails:
```bash
curl -X PUT http://localhost:5000/api/creatures/<creature_id>/equipment/head \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"equipmentId":"<equipment_id>"}'
```
Should return a 400: `"You don't own a <item name> - purchase it from the shop first"`.

**3. Purchase it (deducts from `totalMoney`, adds one copy to your inventory):**
```bash
curl -X POST http://localhost:5000/api/equipment/purchase/<equipment_id> \
  -H "Authorization: Bearer <token>"
```

**4. Check your inventory:**
```bash
curl http://localhost:5000/api/equipment/inventory \
  -H "Authorization: Bearer <token>"
```
Should show that item with `quantity: 1`.

**5. Now equip it** (slot must be `head`, `body`, or `accessory`, and must match the item's `type`):
```bash
curl -X PUT http://localhost:5000/api/creatures/<creature_id>/equipment/head \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"equipmentId":"<equipment_id>"}'
```
This should succeed now. Check your inventory again - `quantity` should have dropped to `0` (or the item should disappear from the list entirely, since the endpoint only returns items with `quantity > 0`).

**6. Check what's equipped:**
```bash
curl http://localhost:5000/api/creatures/<creature_id>/equipment \
  -H "Authorization: Bearer <token>"
```

**7. Unequip it, then check inventory again** - `quantity` should be back to `1`, confirming the item was returned, not destroyed:
```bash
curl -X DELETE http://localhost:5000/api/creatures/<creature_id>/equipment/head \
  -H "Authorization: Bearer <token>"
curl http://localhost:5000/api/equipment/inventory \
  -H "Authorization: Bearer <token>"
```

> Inventory system: equipping now requires actual ownership. Purchasing adds a copy to your `Inventory` (one document per user+item pair, tracking available/unequipped quantity). Equipping consumes one copy; unequipping (or swapping to a different item in the same slot) returns it. Trying to equip something you don't own returns a 400 telling you to buy it first.

## Testing the office upgrade flow

**1. Get your office (auto-creates tier 1 the first time you call this):**
```bash
curl http://localhost:5000/api/office \
  -H "Authorization: Bearer <token>"
```

**2. Start an upgrade to tier 2** (costs 100 money, takes 2 real hours by default):
```bash
curl -X PUT http://localhost:5000/api/office/upgrade \
  -H "Authorization: Bearer <token>"
```

**3. Check progress without finalizing:**
```bash
curl http://localhost:5000/api/office/status \
  -H "Authorization: Bearer <token>"
```
Returns `progressPercent`, `secondsRemaining`, and `readyToFinalize`.

**4. Try upgrading again before it's done** → you'll get a 400 with `secondsRemaining` (same "already in progress" pattern as job assignments).

**5. Once the timer's up, call upgrade again to finalize:**
```bash
curl -X PUT http://localhost:5000/api/office/upgrade \
  -H "Authorization: Bearer <token>"
```
This bumps the tier, updates `creatureCapacity`/`jobSlots`/`equipmentSlots`, and adds any `unlockedFeatures` for that tier.

> Tier progression, costs, and time requirements all live in `config/officeTiers.js` — edit that file directly if you want to tune the numbers (e.g. temporarily set tier 2's `timeRequiredHours` to something tiny like `0.001` so you don't have to wait 2 real hours to test finalization). **Important:** the duration is locked in the moment you *start* an upgrade — editing the config after starting one won't retroactively shorten it, so edit the config first, then start.

**Stuck with an upgrade you don't want to wait out?**
```bash
curl -X DELETE http://localhost:5000/api/office/upgrade \
  -H "Authorization: Bearer <token>"
```
Cancels it (no refund) so you can start a fresh, shorter one for testing instead of editing the database by hand.

## Testing achievements

**1. See the full catalog (what's possible, not what you've unlocked):**
```bash
curl http://localhost:5000/api/achievements/all \
  -H "Authorization: Bearer <token>"
```

**2. See what you've actually unlocked:**
```bash
curl http://localhost:5000/api/achievements \
  -H "Authorization: Bearer <token>"
```

**3. Check/attempt to unlock one** (e.g. after catching 10 creatures):
```bash
curl -X POST http://localhost:5000/api/achievements/team_builder/check \
  -H "Authorization: Bearer <token>"
```
If the requirement is met, this creates the unlocked-achievement record and pays out its money reward immediately. If not met yet, it just returns `unlocked: false`.

Valid `achievementId` values right now: `first_steps`, `wealthy`, `job_master`, `team_builder`, `legendary_hunter`.

> Note: there's no automatic triggering yet — nothing calls `/check` for you when you level up or catch a creature. Right now you (or your frontend) have to call it manually after actions that might unlock something. Wiring this into the relevant controllers (creature catch, assignment completion, etc.) so achievements check themselves automatically is a good next step once you're building the frontend.

## Testing user profile, statistics, and cloud save

**1. Get profile:**
```bash
curl http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer <token>"
```

**2. Update profile (only username/email are editable):**
```bash
curl -X PUT http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username":"joshuac"}'
```

**3. Get aggregated statistics:**
```bash
curl http://localhost:5000/api/user/statistics \
  -H "Authorization: Bearer <token>"
```
Returns money/XP/level from the user record, plus totals rolled up across all your creatures (earnings, jobs completed, creature count, highest-level creature, active job count).

**4. Save a cloud snapshot:**
```bash
curl -X POST http://localhost:5000/api/user/cloud-save \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"gameState":{"userStats":{"money":1000},"creatures":[],"jobAssignments":[],"officeData":{},"achievements":[]}}'
```
This is an upsert — calling it again overwrites the previous save with whatever you send.

**5. Get the cloud save back:**
```bash
curl http://localhost:5000/api/user/cloud-save \
  -H "Authorization: Bearer <token>"
```
> Note: the cloud-save endpoint stores whatever `gameState` object you send without validating its internal shape — that's intentional for now (it's meant to be a snapshot the client controls), but means a malformed save could get stored without an error. Worth adding stricter validation before this goes into a real client.

## Testing offline earnings

This one takes a bit of setup since it's driven by elapsed real time since your `lastLoginTime`.

**1. Get server time (mainly useful for your future client's anti-cheat checks):**
```bash
curl http://localhost:5000/api/game/time \
  -H "Authorization: Bearer <token>"
```

**2. Assign a creature to a short job** (reuse "Create Assignment" from earlier - use a job with `durationMinutes` set low, like `1`, via "Update Job" first).

**3. Manually push `lastLoginTime` into the past** so there's elapsed time to simulate. Since there's no endpoint for this (it's meant to update naturally as you log in/out), edit it directly in MongoDB Atlas:
   - Browse Collections → `users` → your user document → edit `lastLoginTime` → set it to something like 10 minutes ago (or a few hours ago, to test the 8-hour cap)

**4. Calculate offline earnings:**
```bash
curl -X POST http://localhost:5000/api/game/offline-earnings \
  -H "Authorization: Bearer <token>"
```
Returns `offlineMs`, `offlineHoursApplied`, `totalMoneyEarned`, `totalXPEarned`, and a `breakdown` per creature showing how many job cycles it "completed" while you were away.

**5. Confirm the payout landed:** run **Get Profile** or **Get Statistics** → `totalMoney` should be higher by `totalMoneyEarned`.

**6. Test the 8-hour cap:** set `lastLoginTime` to something like 20 hours ago, run offline-earnings again → `offlineHoursApplied` should max out at `8`, not `20`.

> Reminder: offline earnings currently ignore each job's `riskFactor` (every simulated cycle is treated as a guaranteed success) — this is a deliberate simplification noted in the code, not a bug, but worth revisiting if you want offline time to carry the same risk as active play.

## Testing the creature endpoints

All creature routes require the `Authorization: Bearer <token>` header from login.

**List all species:**
```bash
curl http://localhost:5000/api/creatures/species \
  -H "Authorization: Bearer <token>"
```

**Catch a creature:**
```bash
curl -X POST http://localhost:5000/api/creatures \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"creatureSpeciesId":"<species_id_from_above>","nickname":"Sparky"}'
```

**List my creatures:**
```bash
curl http://localhost:5000/api/creatures \
  -H "Authorization: Bearer <token>"
```

**Rename / favorite a creature:**
```bash
curl -X PUT http://localhost:5000/api/creatures/<creature_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"Blaze","isFavorite":true}'
```

**Release a creature:**
```bash
curl -X DELETE http://localhost:5000/api/creatures/<creature_id> \
  -H "Authorization: Bearer <token>"
```

## Testing the auth endpoints

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"joshua","email":"joshua@example.com","password":"test1234"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joshua@example.com","password":"test1234"}'
```

Copy the `token` from the response, then:

**Get current user:**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <paste_token_here>"
```

## Next steps (not yet built)

All route groups from your original spec exist, the equipment/office/achievement integration gaps are closed, and content is fully seeded (24 species, 53 jobs, 15 equipment items). What's left is genuinely just the frontend and a few honest content caveats:

- Cloud save doesn't validate the shape of the `gameState` object it's given
- Offline earnings ignores each job's `riskFactor` (deliberate simplification, not a bug - see README section above)
- The 24 creature names/descriptions/personalities and 15 equipment item descriptions are solid placeholder text, not final game copy - and `spriteAssetPath`/`icon` fields point to files that don't exist yet since there's no art made - review/replace before this is player-facing
- Inventory items acquired outside purchasing (e.g. a future "Rare Find" drop from a boss battle, or an achievement reward) would need to also `$inc` the Inventory model the same way `purchaseEquipment` does - right now the only path that grants inventory is buying from the shop
