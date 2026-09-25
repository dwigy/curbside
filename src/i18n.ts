import { STRINGS_EN } from './content/strings.en';
import { fill } from './engine/text';

// All UI and system strings live in one dictionary per locale. English only at launch.
// Narrative content (events, story, codex) lives in src/content as typed data.
export type StringKey = keyof typeof STRINGS_EN;

const dict: Record<string, string> = STRINGS_EN;

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  let s = dict[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
  return fill(s);
}
