# Curbside: Design

A spiritual successor to the rags-to-riches life-sim genre, and an original work: no borrowed names, art, text or item names. Working title **Curbside**. Every proper name lives in `src/content/config.ts`.

This document is the living spec. The **Status** column tracks what's built.

---

## Pillars

1. **Rags to riches from literally zero.** The arc is the game.
2. **Hard but fair, and legible.** Difficulty is a feature. Every probability shown is the true probability, and every cash change is a ledger entry with a reason.
3. **Time is the currency.** Actions spend days, and days spend life. The clock is a number, never a vague bar.
4. **Real money literacy.** Recurring bills, deposits, theft risk versus a bank account; later credit, loans, taxes, retirement.
5. **Dignity.** The protagonist is a person who lost everything, never a joke. Humor comes from situations and characters.
6. **Ad-free, offline, no monetization.** Sacred.

## Status by milestone

| Milestone | Scope | Status |
|---|---|---|
| **1. Vertical slice (v0.1.0)** | Engine, Act I street game, shelter ladder to a rented room, life clock, onboarding, debug menu core, save/load, PWA, Pages deploy | **Built** |
| 2. Climb (v0.3.0) | Education, careers, bank/credit/loans, daily market, Act II story, cast arcs, journal | Next |
| 3. Empire (v0.6.0) | Real estate, businesses with levers, stocks/crypto/collectibles, economy cycles, taxes, Act III | – |
| 4. Legacy (v0.9.0) | Retirement, will and heirs, philanthropy and city changes, endings, trophies, leaderboard, run modifiers, balance pass | – |
| 5. Polish (v1.0.0) | 120+ events, visual, accessibility and bug passes, final docs | – |

## What v0.1.0 contains

- **Engine** (`src/engine/`): pure `step(state, action)`. A seeded mulberry32 RNG whose state is stored in the save. Day loop covering needs, housing, rent, dog, theft and lifespan. Story beats, random events, warnings, batches with auto-eat, a versioned save with migrations, finance math (amortization and progressive tax, tested now and used in later acts), and headless bots.
- **Act I content:**
  - 4 backstories, 6 hustles, 5 life activities, 8 foods and 11 shop items
  - 3 housing tiers (street, shelter, two rooms) and 3 open districts (3 more shown locked)
  - 12 story beats, 10 story conversations and 48 random events
  - 10 onboarding goals, 21 Street Smarts codex entries, 3 story cards and 12 illustrated scenes
- **Recurring cast so far:**
  - **Ines Calder**: the kitchen mentor, whose trust gates the room reference
  - **Wick**: the street friend, with a crisis choice that has three outcomes
  - **Priya Sandhu**: the rival, who can offer a crew spot or stay a rival
  - **Grace Tolliver**: the banker
  - **Mr. Albescu**: the landlord, with no pets allowed
  - **Jaylen** and **Rafe** are defined and arrive in Act II.
- **A companion dog.** A story beat around day 6 lets you take in a stray: +25% when asking for change and a daily mood boost. Food costs $9/week, the dog leaves after 5 hungry days (with warnings every day before that), and it isn't allowed in the shelter or Albescu's rooms.
- **UI:**
  - Mobile-first, one thumb. Top bar with cash, life left (years + days, trend arrow and pace), date, weather, and four need bars, all tap-to-explain.
  - Tabs unlock gradually: Life, Hustle, Shop, Money, City, Journal.
  - Hold-to-repeat, ×10, ×100 and "Until…" batches, with a "while you were busy" summary afterwards.
  - Confirmations for anything over 7 days or 10% of cash, one-level undo, and disabled actions that say why.
- **Look:** the palette interpolates from cool concrete (street) to warm gold as prosperity rises (housing tier plus log net worth). Illustrated SVG story cards, a light sweep when a day passes, and cash ticks. Reduced motion is respected (system setting, or override it in Settings).
- **Sound:** synthesized with Web Audio, off by default.
- **Saves:** autosave after every action, 3 slots, JSON export and import, schema migrations.
- **Debug menu:** see the README.

## Core loop

- **Time.** The unit is the day. Actions cost days; each day runs daytime (activity outcome), then night (food, energy, diet, health, happiness, lifespan, dog, theft), then rent and shelter ticks, then midnight (birthday, weather, expiries, mail, collapse and death checks).
- **Life expectancy.** `lifeExpectancyDays` is an age that moves with lifestyle. Days left = expectancy − current age. The trend arrow compares the last 30 days: a pace of 1.0× is normal aging, and higher means hard living is taking years off.
- **Stats.** Cash (plus bank), health, happiness, fed, energy, reputation, diet (advanced) and skills: street smarts, charisma, trade, business and music.
- **Events.** Data-driven (`content/events.ts`, `content/storyEvents.ts`), with declarative conditions and effects, weights, cooldowns and `once`. Choices can show true odds, costs, and requirements with reasons.
- **Story.** Beats (`content/story.ts`) fire once when their condition holds and can open conversations, show story cards, unlock tabs, write journal entries and add codex entries. Goals form the onboarding chain shown on the Life tab.

## Onboarding (diegetic)

1. The story card opens. The goal: eat at the free kitchen, where you meet Ines.
2. Earn $20 (asking for change or cans), which unlocks the **Shop**. Next goal: a sleeping bag.
3. Wick shows up after two days of hustling and teaches you his can route.
4. Day 6: a stray dog.
5. Day 12+: Ines explains papers and offers the kitchen's mailing address. Birth certificate, then State ID, then the **Money** tab and the bank.
6. Wick points you to other districts: the **City** tab.
7. Day labor (boots and ID) is where you meet Priya.
8. The room flyer arrives. Save the deposit, earn Ines's reference, and move in: "A door that locks". Act I ends and the Act II teaser plays.

Every stat and number is tappable. The Street Smarts codex fills in as you discover systems.

## Design decisions made during Milestone 1

These are worth knowing. Change them if you disagree.

1. **City: Port Ellery.** Districts: the Riverfront, Downtown, University Hill (open in Act I); Old Mill, Maple Park, the Heights (locked).
2. **Styling:** plain CSS with custom properties rather than Tailwind or CSS modules. The palette shift needs runtime-interpolated variables anyway, and this keeps the build dependency-light.
3. **State:** a tiny `useSyncExternalStore` store instead of Zustand. It's the same idea with no dependency.
4. **Dark, warm UI** as the only theme for now. The gritty-to-golden shift is the identity; a light theme can come in the polish pass.
5. **Undo** covers deliberate actions (activities, eating, buying, moving, banking). It does not cover event choices, story dismissals or naming, because undo is for misclicks, not rerolls. The RNG state lives in the save, so undoing and repeating an action gives the same result anyway.
6. **Single taps never auto-eat.** Batches and hold-to-repeat do, when the "auto-eat" setting is on (default), choosing the cheapest filling food available. Dog food is bought automatically in batches too.
7. **Landlords require a reference**: Ines trust ≥ 30 (or Priya ≥ 30). This makes the mentor relationship part of the climb and paces Act I, as the bot data showed rooms came too fast without it.
8. **Deposits are two weeks' rent.**
9. **No theft in the first 7 days,** and no random events in the first 3. Onboarding lands before the city bites.
10. **Collapses can't kill outright**, so death always follows a warning.
11. **Narrative text is data** in `src/content/*` (English). UI chrome goes through `t()` and a single dictionary, `strings.en.ts`. A future locale adds a strings file plus translated content files.
12. **The Act I ending** keeps the life playable (rent keeps coming due) while Act II is built.
13. **The "Lost the business" backstory's $8,400 collections debt** is recorded and shown under Money → Bills, but it's dormant until credit arrives in Act II.

## Architecture rules (unchanged from the brief)

- Game logic lives in `src/engine/` and is framework-free. The UI never mutates state.
- Seeded RNG; runs are reproducible.
- All content lives in `src/content/` as typed data. All tunables live in `balance.ts`.
- Tests cover: engine invariants (ledger reconciles, no negative money), honest odds, rent and eviction, batches, loan and tax math, save/load round-trips with continued determinism, content integrity, i18n key coverage, and a 60-year bot life with no errors or NaN.
- The save schema is versioned with migrations.

## Roadmap notes for Milestone 2

- **Education:** GED at the library (uses the library activity), trade certificates, community college, scholarships with shown odds.
- **Careers:** 12+ tracks with bosses and promotions (true odds), quitting and firing.
- **Bank:** savings interest, a credit score driven by behaviour (rent on time, the collections debt), loans with amortization schedules (`engine/finance.ts` is ready), and a daily market with sparklines.
- **Act II cast:** Jaylen's arc, a love interest, Rafe from the backstory, and Wick's arc resolving based on the Act I crisis flags (`wickHelped`, `wickRelapse`, `wickAbandoned`, `wickHospital`).
- **Balance:** add living costs so the room phase stops over-saving.
