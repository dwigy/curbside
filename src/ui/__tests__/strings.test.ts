import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STRINGS_EN } from '../../content/strings.en';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?)$/.test(p) && !p.includes('__tests__') ? [p] : [];
  });
}

describe('i18n', () => {
  it('every literal t() key exists in the English dictionary', () => {
    const missing: string[] = [];
    for (const f of files('src')) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) {
        if (!(m[1] in STRINGS_EN)) missing.push(`${f}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('dynamic key families are complete', () => {
    for (const k of ['clear', 'rain', 'snow', 'heat', 'cold']) expect(`weather.${k}` in STRINGS_EN).toBe(true);
    for (const k of ['spring', 'summer', 'autumn', 'winter']) expect(`season.${k}` in STRINGS_EN).toBe(true);
    for (const k of ['life', 'hustle', 'shop', 'money', 'city', 'journal']) expect(`tab.${k}` in STRINGS_EN).toBe(true);
    for (const k of ['done', 'until', 'event', 'story', 'prompt', 'warning', 'dead', 'unavailable']) expect(`summary.stop.${k}` in STRINGS_EN).toBe(true);
    for (const k of ['streetSmarts', 'charisma', 'trade', 'business', 'music']) expect(`skill.${k}` in STRINGS_EN).toBe(true);
  });
});
