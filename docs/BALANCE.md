# Balance

Every tunable number lives in [`src/content/balance.ts`](../src/content/balance.ts). This document explains the reasoning behind each block and records what the bot simulator says. Update both together.

**Design target for Act I.** A careful player gets off the street and into a rented room in roughly 60–120 in-game days, which is 30–60 minutes of real play. A perfect bot does it in about 40 days. A player who only asks for change never gets there. Hard but fair: every setback can be seen coming.

## Latest simulator run (v0.1.0)

`SIM_RUNS=24 SIM_YEARS=3 npm run sim`, backstory "laid off" (age 38, about 35.7 years left at the start):

| Strategy | Reached a room | Median day | Net worth y1 / y2 / y3 |
|---|---|---|---|
| beggar (only asks for change) | 0/24 | – | $276 / $703 / $913 |
| scavenger (only collects cans) | 0/24 | – | $1,436 / $1,918 / $2,187 |
| climber (follows the intended path) | 24/24 | 43 | $12,286 / $29,779 / $48,426 |

**Known issue, deliberately left for Milestone 2.** Once in a room, the climber saves too fast (about $12k/year) because Act I has nothing to spend money on after rent. Act II adds the pressure: school, a career ladder, transport, groceries and utilities, credit and loans. Retune then, not now.

## Time and life

| Key | Value | Why |
|---|---|---|
| `life.dailyDelta.street` | −1.5 | Each day on the street costs 1.5 extra days of life (the clock runs at 2.5×). The pressure is visible from day one via the ×-pace readout and red ▼. |
| `life.dailyDelta.shelter` | −0.4 | Indoors is a big improvement, but a shelter isn't a home. |
| `life.dailyDelta.room` | 0 | A room brings you back to normal aging. Diet and health decide the rest. |
| `winterStreet` | −1.0 (halved with a sleeping bag) | Winter outside is the most dangerous thing in Act I, which makes the $22 sleeping bag the first real purchase. |
| `healthBelow40` / `healthBelow20` | −1 / −2.5 | Poor health visibly costs years, so the clinic and rest matter. |
| `starving` | −2 | Starving is severe but always warned about (food < 10). |
| `goodDiet` / `poorDiet` | +0.25 / −0.25 | Diet is a slow lever, and the only Act I way to *gain* time. |
| `collapse` | −120 days, 4 days lost | Health 0 means the ER. A collapse is capped so it can never drop you below 30 days left in one step. Death always comes after a warning. |
| `warnAt` | 5y, 1y, 90d | Required thresholds. Warnings stop batches and need to be acknowledged. |

## Needs

| Key | Value | Why |
|---|---|---|
| `foodDrain` | 28/day (×0.7–1.4 by activity) | The free kitchen lunch (+45) nearly covers a day. Sundays it's closed, which forces a small food budget. |
| `sleep` | street 22 (+8 with a bag), shelter 38, room 50 | Energy is the soft cap on hard work. On the street, day labor (−45) is only sustainable every other day. |
| Hungry / tired / miserable income | ×0.8 / ×0.7 / ×0.85 | Neglecting yourself costs money, not just stats. |

## Hustles (per day, before multipliers)

| Hustle | Base | Unlock | Notes |
|---|---|---|---|
| Ask for change | $10 ±50% | start | ×1.5 downtown; +25% with the dog; the corner wears out, up to −45% (`spotFatigue`), which stops "beg forever" from being optimal. |
| Cans and bottles | $9 ±45% | start | Scales with street smarts (÷120); ×1.6 with a cart; +15% with Wick's route. |
| Busk | $11 harmonica, $24 guitar | instrument | The most weather-sensitive hustle (rain ×0.3). |
| Odd jobs | $30–50 at 45%+ | phone plus plan | The chance rises with street smarts and reputation. The plan costs $15 a month: the first recurring bill. |
| Day labor | $96 at 30%+ | ID plus boots | +0.3%/trade point, +5% with clean clothes, +10% on Priya's crew, −20% if tired, −15% in winter. The main Act I earner. |
| Deliveries | $55 ±35% | bike, phone and plan | Rain surge ×1.2; no riding in snow; bike theft 3%/night without a lock. |

## Odds (all shown to the player, all honored exactly)

| Thing | Chance | Notes |
|---|---|---|
| Shelter bed | 65%, 40% in winter, +15% once Ines trust ≥ 30 | 60-night stays, then a 14-day wait before you can reapply. |
| Clinic, seen same day | 75% | +18 health if seen, +6 if not. |
| Nightly theft of cash | street 3%, shelter 1%, room 0.3% | ×0.3 when carrying under $20; reduced by street smarts; none in the first 7 days. |
| Random event | 7% per day | None in the first 3 days; 30-day cooldown per event by default. |

The tests in `src/engine/__tests__/engine.test.ts` check the shelter and day labor odds over 1,500 seeded trials each.

## Money milestones

| Thing | Cost | Why |
|---|---|---|
| Sleeping bag | $22 | The first purchase; about 2–3 days of work. |
| Birth certificate | $15, 14 days by mail | Realistic bureaucracy, and it needs Ines's mailing address. |
| State ID | $28 and 2 days | Unlocks the bank, day labor and renting. |
| Bank account | $25 opening deposit | Makes savings theft-proof. |
| Albescu room | $85/week + $170 deposit | Plus a reference: Ines trust ≥ 30. Trust grows by +0.4 per kitchen meal (capped at 40) plus story moments. This makes the relationship part of the path. |
| Canal room | $110/week + $220 deposit | Allows dogs, so a dog costs about $25/week more. That's a meaningful choice. |
| Rent grace | 7 days | Then eviction with the deposit forfeited. Warned on day 1 of lateness. |

## Changing numbers

1. Edit `balance.ts`.
2. Run `npm test` (the invariants must hold) and `SIM_RUNS=24 SIM_YEARS=3 npm run sim`.
3. Update the tables above.
