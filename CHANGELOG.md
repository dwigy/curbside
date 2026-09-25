# Changelog

## v0.1.0: Act I vertical slice

The first playable slice: from under the overpass to a door that locks.

- **Engine:** pure, seeded, deterministic day simulation. Every cash change is a reasoned ledger entry, and saves are versioned with migrations.
- **Life clock:** exact years + days left, with a trend arrow and pace. Warnings at 5 years, 1 year and 90 days; a collapse at health 0 never kills without warning.
- **Act I:** 4 backstories, 6 hustles (asking for change, cans, busking, odd jobs, day labor, deliveries), the free kitchen, the shelter (with true bed odds), papers (birth certificate → State ID), a bank account, two rooms with rent and eviction, a companion dog, and 3 districts.
- **Story:** opening and closing story cards, Ines, Wick (with a crisis choice), Priya, Grace, 10 story conversations, an auto-written journal, and 48 random events with honest odds.
- **Onboarding:** a goal chain on the Life tab, tabs that unlock as you discover them, tap-to-explain on every stat, and the Street Smarts codex.
- **Misclick safety:** confirmations over 7 days or 10% of cash, one-level undo, and disabled actions that explain why.
- **No more tap-spam:** hold-to-repeat, ×10, ×100 and "Until…" batches with auto-eat, followed by a "while you were busy" summary.
- **Look:** a palette that shifts from street grey to gold as life improves, 12 illustrated SVG scenes, an avatar builder, and a city map.
- **Platform:** installable PWA, fully offline, 3 save slots, and JSON export/import.
- **Debug menu:** stats, time, events, items, story, death, seed replay, ledger, state inspector, saves, and a balance simulator.
- **Tests:** invariants, odds honesty, rent and eviction, finance math, saves, content integrity, i18n coverage, and a 60-year smoke run.
