// Balance report, not an assertion suite: `npm run sim` writes bot medians used to tune BALANCE.md.
// Env: SIM_RUNS (default 40), SIM_YEARS (default 60), SIM_OUT (default sim-report.txt).
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { simulate, STRATEGIES } from '../bot';

it.skipIf(!process.env.SIM)('balance report', () => {
  const runs = Number(process.env.SIM_RUNS ?? 40);
  const years = Number(process.env.SIM_YEARS ?? 60);
  const lines: string[] = [`runs=${runs} years=${years}`];
  for (const strategy of STRATEGIES) {
    const r = simulate(strategy, runs, 1000, 365 * years);
    lines.push(
      `[${strategy}] daysLeftAtStart=${r.medianDaysLeftAtStart} medianDeathAge=${r.medianDeathAge} reachedRoom=${r.reachedRoom}/${r.runs} medianRoomDay=${r.medianRoomDay}`,
      `  causes=${JSON.stringify(r.causes)}`,
      `  medianNetWorthByYear=${JSON.stringify(r.medianNetWorthByYear.slice(0, 20))}`,
    );
  }
  writeFileSync(process.env.SIM_OUT ?? 'sim-report.txt', lines.join('\n') + '\n');
}, 1_800_000);
