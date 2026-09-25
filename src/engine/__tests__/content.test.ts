import { describe, expect, it } from 'vitest';
import { ACTIVITIES } from '../../content/activities';
import { CODEX } from '../../content/codex';
import { NAMES } from '../../content/config';
import { ITEMS, OWNED_ONLY } from '../../content/items';
import { BEATS, GOALS, STORY_CARDS } from '../../content/story';
import { ALL_EVENTS } from '../sim';
import type { Cond, Effect, EventDef } from '../types';

const itemIds = new Set([...ITEMS.map((i) => i.id), ...Object.keys(OWNED_ONLY)]);
const codexIds = new Set(CODEX.map((c) => c.id));
const eventIds = new Set(ALL_EVENTS.map((e) => e.id));
const cardIds = new Set(STORY_CARDS.map((c) => c.id));
const beatIds = new Set(BEATS.map((b) => b.id));

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
}
const validPlaceholder = (p: string) => p === 'name' || p === 'dog' || p in NAMES;

function checkCond(c: Cond | undefined, where: string, errs: string[]) {
  if (!c) return;
  for (const i of [...(c.hasItem ?? []), ...(c.lacksItem ?? [])]) if (!itemIds.has(i)) errs.push(`${where}: unknown item ${i}`);
  for (const b of [...(c.beat ?? []), ...(c.notBeat ?? [])]) if (!beatIds.has(b)) errs.push(`${where}: unknown beat ${b}`);
  for (const sub of c.any ?? []) checkCond(sub, where, errs);
}

function checkEffect(e: Effect | undefined, where: string, errs: string[]) {
  if (!e) return;
  for (const i of [...(e.addItem ?? []), ...(e.removeItem ?? [])]) if (!itemIds.has(i)) errs.push(`${where}: unknown item ${i}`);
  for (const c of e.codex ?? []) if (!codexIds.has(c)) errs.push(`${where}: unknown codex ${c}`);
  for (const s of e.story ?? []) if (!cardIds.has(s)) errs.push(`${where}: unknown story card ${s}`);
  if (e.event && !eventIds.has(e.event)) errs.push(`${where}: unknown event ${e.event}`);
  if (e.journal) for (const p of placeholders(e.journal)) if (!validPlaceholder(p)) errs.push(`${where}: bad placeholder {${p}}`);
}

function eventTexts(e: EventDef): string[] {
  return [e.title, e.text, ...(e.choices ?? []).flatMap((c) => [c.label, c.success.text, c.failure?.text ?? '', c.requires?.reason ?? ''])];
}

describe('content integrity', () => {
  it('event ids are unique', () => {
    expect(eventIds.size).toBe(ALL_EVENTS.length);
  });

  it('events reference real things and use valid placeholders', () => {
    const errs: string[] = [];
    for (const e of ALL_EVENTS) {
      checkCond(e.when, e.id, errs);
      checkEffect(e.effects, e.id, errs);
      for (const c of e.choices ?? []) {
        checkCond(c.when, e.id, errs);
        checkCond(c.requires?.cond, e.id, errs);
        checkEffect(c.success.effects, e.id, errs);
        checkEffect(c.failure?.effects, e.id, errs);
        if (typeof c.chance === 'number' && (c.chance < 0 || c.chance > 1)) errs.push(`${e.id}: chance out of range`);
        if (c.chance !== undefined && !c.failure) errs.push(`${e.id}: chance without failure outcome`);
      }
      if (e.choices?.length && !e.choices.some((c) => !c.when && !c.requires && !c.costCash)) errs.push(`${e.id}: no always-available choice`);
      for (const t of eventTexts(e)) for (const p of placeholders(t)) if (!validPlaceholder(p)) errs.push(`${e.id}: bad placeholder {${p}}`);
      if (/\{dog\}/.test(eventTexts(e).join(' ')) && e.weight > 0 && e.when?.hasDog !== true) errs.push(`${e.id}: uses {dog} without hasDog`);
    }
    expect(errs).toEqual([]);
  });

  it('beats, goals, activities and items reference real things', () => {
    const errs: string[] = [];
    for (const b of BEATS) {
      checkCond(b.when, `beat ${b.id}`, errs);
      checkEffect(b.effects, `beat ${b.id}`, errs);
    }
    for (const g of GOALS) {
      checkCond(g.when, `goal ${g.id}`, errs);
      checkCond(g.done, `goal ${g.id}`, errs);
    }
    for (const a of ACTIVITIES) {
      checkCond(a.requires, `activity ${a.id}`, errs);
      checkCond(a.visible, `activity ${a.id}`, errs);
    }
    for (const i of ITEMS) {
      checkCond(i.requires, `item ${i.id}`, errs);
      checkCond(i.visible, `item ${i.id}`, errs);
      checkEffect(i.onBuy, `item ${i.id}`, errs);
      if (i.delivers && !itemIds.has(i.delivers)) errs.push(`item ${i.id}: delivers unknown ${i.delivers}`);
    }
    for (const c of STORY_CARDS) for (const p of c.body.flatMap(placeholders)) if (!validPlaceholder(p) && p !== 'game') errs.push(`card ${c.id}: {${p}}`);
    expect(errs).toEqual([]);
  });

  it('has a healthy Act I random event pool', () => {
    expect(ALL_EVENTS.filter((e) => e.weight > 0).length).toBeGreaterThanOrEqual(40);
  });
});
