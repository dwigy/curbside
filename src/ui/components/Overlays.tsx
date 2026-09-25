import { useState } from 'react';
import { codexById } from '../../content/codex';
import { storyCardById } from '../../content/story';
import { formatSpan } from '../../engine/calendar';
import { choiceAvailable, resolveChance } from '../../engine/step';
import { eventById } from '../../engine/sim';
import { fill, money, pct } from '../../engine/text';
import type { GameState } from '../../engine/types';
import { t } from '../../i18n';
import { Scene } from '../art/Scene';
import { downloadText, pickFile } from '../persist';
import {
  closeSheet, dispatch, exportSave, getState, importSave, openSheet, quitToTitle, setState, toast, updateSettings, useStore,
} from '../store';
import { Icon } from './Icons';
import { Sheet } from './Sheet';

/** Shows whatever needs the player's attention, one thing at a time, in priority order. */
export function Overlays({ g }: { g: GameState }) {
  const outcome = useStore((s) => s.outcome);
  const summary = useStore((s) => s.summary);
  const warnings = useStore((s) => s.warnings);
  const sheet = useStore((s) => s.sheet);

  if (g.pendingStory.length) return <StoryCard g={g} id={g.pendingStory[0]} />;
  if (g.pendingPrompt === 'nameDog') return <NameDog />;
  if (outcome) return <OutcomeSheet />;
  if (g.pendingEvent) return <EventSheet g={g} />;
  if (summary) return <SummarySheet />;
  if (warnings.length) return <WarningsSheet />;
  if (sheet) return <GenericSheet g={g} />;
  return null;
}

function StoryCard({ g, id }: { g: GameState; id: string }) {
  const card = storyCardById(id);
  if (!card) {
    dispatch({ type: 'dismissStory' });
    return null;
  }
  const extra = card.byBackstory?.[g.character.backstory];
  return (
    <div className="story" role="dialog" aria-modal="true" aria-label={card.title}>
      <div className="story-inner">
        <div className="story-art">
          <Scene id={card.art} />
        </div>
        <div className="story-body">
          <div className="kicker">{card.kicker}</div>
          <h1>{fill(card.title, g)}</h1>
          {card.body.map((p, i) => (
            <p key={i}>{fill(p, g)}</p>
          ))}
          {extra && <p className="backstory">{fill(extra, g)}</p>}
        </div>
        <div className="story-foot">
          <button className="btn primary block" autoFocus onClick={() => dispatch({ type: 'dismissStory' })}>
            {t('modal.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

function NameDog() {
  const [name, setName] = useState('');
  const ok = name.trim().length > 0;
  return (
    <Sheet label={t('dog.title')}>
      <div className="event-art">
        <Scene id="dog" />
      </div>
      <h2>{t('dog.title')}</h2>
      <p className="muted">{t('dog.body')}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) dispatch({ type: 'nameDog', name });
        }}
      >
        <input className="input" style={{ marginTop: 12 }} value={name} maxLength={20} onChange={(e) => setName(e.target.value)} placeholder={t('dog.placeholder')} aria-label={t('dog.title')} />
        <div className="actions">
          <button className="btn primary" type="submit" disabled={!ok}>
            {t('dog.ok')}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

function EventSheet({ g }: { g: GameState }) {
  const e = eventById(g.pendingEvent!.id);
  if (!e) return null;
  const choices = e.choices ?? [];
  return (
    <Sheet label={fill(e.title, g)}>
      {e.art && (
        <div className="event-art">
          <Scene id={e.art} />
        </div>
      )}
      <h2 className={e.tone === 'bad' ? 'bad' : e.tone === 'good' ? '' : ''}>{fill(e.title, g)}</h2>
      <p className="event-text">{fill(e.text, g)}</p>
      <div className="choices">
        {choices.length === 0 && (
          <button className="btn primary block" onClick={() => dispatch({ type: 'choose', choice: 0 })}>
            {t('modal.continue')}
          </button>
        )}
        {choices.map((c, i) => {
          const av = choiceAvailable(g, c);
          if (!av.visible) return null;
          const p = c.chance !== undefined ? resolveChance(c.chance, g) : null;
          // Expected value for gambles: shown whenever a paid choice has odds.
          const ev = p !== null && c.costCash ? p * (c.success.effects?.cash ?? 0) + (1 - p) * (c.failure?.effects?.cash ?? 0) - c.costCash : null;
          return (
            <button key={i} className="choice" disabled={!av.ok} onClick={() => dispatch({ type: 'choose', choice: i })}>
              <span className="grow">
                {fill(c.label, g)}
                {(c.costCash || !av.ok) && <small>{!av.ok ? av.reason : t('event.costs', { cost: money(c.costCash!) })}</small>}
              </span>
              <span className="stack" style={{ gap: 4, alignItems: 'flex-end' }}>
                {p !== null && <span className="chip warn odds">{t('event.odds', { p: pct(p) })}</span>}
                {ev !== null && <span className={`chip odds ${ev < 0 ? 'bad' : 'good'}`}>{t('event.ev', { ev: `${ev < 0 ? '−' : '+'}${money(Math.abs(Math.round(ev * 100) / 100))}` })}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function OutcomeSheet() {
  const o = useStore((s) => s.outcome)!;
  const close = () => setState({ outcome: null });
  return (
    <Sheet label={o.title} onClose={close}>
      <h2>{o.title}</h2>
      <p className={`outcome ${o.success === false ? 'bad' : o.success ? 'good' : ''}`}>{o.text}</p>
      {o.chance !== null && (
        <p className="small muted" style={{ marginTop: 10 }}>
          {o.success ? t('outcome.success') : t('outcome.failure')} {t('outcome.chance', { p: pct(o.chance) })}
        </p>
      )}
      <div className="actions">
        <button className="btn primary" onClick={close}>
          {t('modal.continue')}
        </button>
      </div>
    </Sheet>
  );
}

function Delta({ v, fmt = (n: number) => n.toFixed(0) }: { v: number; fmt?: (n: number) => string }) {
  const cls = v > 0.004 ? 'good' : v < -0.004 ? 'bad' : 'muted';
  return (
    <span className={`${cls} num`}>
      {v > 0 ? '+' : ''}
      {fmt(v)}
    </span>
  );
}

function SummarySheet() {
  const s = useStore((x) => x.summary)!;
  const close = () => setState({ summary: null, warnings: [] });
  const stopText = s.stop === 'unavailable' ? t('summary.stop.unavailable', { why: s.stopDetail ?? '' }) : t(`summary.stop.${s.stop}`);
  return (
    <Sheet label={t('summary.title')} onClose={close}>
      <h2>{t('summary.title')}</h2>
      <p className="small muted">{stopText}</p>
      <div className="summary-grid">
        <div className="summary-cell">
          <div className="k">{t('summary.days')}</div>
          <div className="v">{s.days}</div>
        </div>
        <div className="summary-cell">
          <div className="k">{t('summary.cash')}</div>
          <div className="v">
            <Delta v={s.cashDelta} fmt={(n) => money(n)} />
          </div>
        </div>
        <div className="summary-cell">
          <div className="k">{t('summary.earned')}</div>
          <div className="v num">{money(s.earned)}</div>
        </div>
        <div className="summary-cell">
          <div className="k">{t('summary.life')}</div>
          <div className="v">
            <Delta v={s.daysLeftDelta} fmt={(n) => `${n < 0 ? '−' : ''}${formatSpan(Math.abs(n))}`.replace('−−', '−')} />
          </div>
        </div>
        {s.bankDelta !== 0 && (
          <div className="summary-cell">
            <div className="k">{t('summary.bank')}</div>
            <div className="v">
              <Delta v={s.bankDelta} fmt={(n) => money(n)} />
            </div>
          </div>
        )}
        {s.spentFood > 0 && (
          <div className="summary-cell">
            <div className="k">{t('summary.food')}</div>
            <div className="v num">{money(s.spentFood)}</div>
          </div>
        )}
      </div>
      <div className="row wrap small">
        {(['health', 'happiness', 'food', 'energy'] as const).map((k) => (
          <span key={k} className="chip">
            {t(`top.${k === 'happiness' ? 'happy' : k === 'food' ? 'fed' : k}`)} {Math.round(s.stats[k].to)} <Delta v={Math.round(s.stats[k].to - s.stats[k].from)} />
          </span>
        ))}
      </div>
      {s.warnings.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {s.warnings.map((w, i) => (
            <div className="warning-box" key={i}>
              <Icon.alert />
              <span>{w.text}</span>
            </div>
          ))}
        </div>
      )}
      {s.highlights.length > 0 && (
        <>
          <h3 className="section-title">{t('summary.highlights')}</h3>
          <ul className="loglist">
            {s.highlights.slice(-12).map((l, i) => (
              <li key={i}>
                <span className={l.kind === 'good' ? 'good' : l.kind === 'bad' ? 'bad' : 'warn'}>{l.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="actions">
        <button className="btn primary" onClick={close}>
          {t('modal.continue')}
        </button>
      </div>
    </Sheet>
  );
}

function WarningsSheet() {
  const warnings = useStore((s) => s.warnings);
  const close = () => setState({ warnings: [] });
  return (
    <Sheet label={t('warnings.title')} onClose={close}>
      <h2 className="warn">{t('warnings.title')}</h2>
      {warnings.map((w, i) => (
        <div className="warning-box" key={i}>
          <Icon.alert />
          <span>{w.text}</span>
        </div>
      ))}
      <div className="actions">
        <button className="btn primary" onClick={close}>
          {t('modal.continue')}
        </button>
      </div>
    </Sheet>
  );
}

function UntilForm({ label, action }: { label: string; action: Parameters<typeof dispatch>[0] }) {
  const g = getState().game!;
  const [cash, setCash] = useState(String(Math.ceil((g.cash + (g.bank ?? 0) + 50) / 10) * 10));
  const [health, setHealth] = useState('40');
  const [energy, setEnergy] = useState('');
  const [food, setFood] = useState('');
  const [max, setMax] = useState('60');
  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const rows: [string, string, (v: string) => void][] = [
    [t('until.cash'), cash, setCash],
    [t('until.health'), health, setHealth],
    [t('until.energy'), energy, setEnergy],
    [t('until.food'), food, setFood],
    [t('until.max'), max, setMax],
  ];
  return (
    <>
      <h2>{t('until.title')}</h2>
      <p className="small muted">
        {label}. {t('until.hint')}
      </p>
      <div className="stack" style={{ marginTop: 12, gap: 10 }}>
        {rows.map(([l, v, set]) => (
          <label key={l} className="row spread">
            <span className="small">{l}</span>
            <input className="input num" style={{ width: 110, textAlign: 'right' }} inputMode="numeric" value={v} onChange={(e) => set(e.target.value.replace(/[^0-9]/g, ''))} placeholder="—" />
          </label>
        ))}
      </div>
      <div className="actions">
        <button className="btn ghost" onClick={closeSheet}>
          {t('modal.cancel')}
        </button>
        <button
          className="btn primary"
          onClick={() => {
            closeSheet();
            dispatch(action, {
              times: Math.max(1, Math.min(365, num(max) ?? 60)),
              until: { cashAtLeast: num(cash), healthBelow: num(health), energyBelow: num(energy), foodBelow: num(food) },
            });
          }}
        >
          {t('until.start')}
        </button>
      </div>
    </>
  );
}

function GenericSheet({ g }: { g: GameState }) {
  const sheet = useStore((s) => s.sheet)!;
  const settings = useStore((s) => s.settings);
  const slot = useStore((s) => s.slot);
  const [dontAsk, setDontAsk] = useState(false);

  switch (sheet.kind) {
    case 'confirm':
      return (
        <Sheet label={sheet.title} onClose={closeSheet}>
          <h2>{sheet.title}</h2>
          <p>{sheet.body}</p>
          {sheet.batchNote && (
            <label className="row small" style={{ marginTop: 12 }}>
              <input type="checkbox" checked={dontAsk} onChange={(e) => setDontAsk(e.target.checked)} />
              {t('confirm.dontAsk')}
            </label>
          )}
          <div className="actions">
            <button className="btn ghost" onClick={closeSheet}>
              {t('modal.cancel')}
            </button>
            <button
              className="btn primary"
              onClick={() => {
                if (dontAsk) updateSettings({ confirmBatches: false });
                closeSheet();
                sheet.onConfirm();
              }}
            >
              {sheet.confirmLabel}
            </button>
          </div>
        </Sheet>
      );
    case 'until':
      return (
        <Sheet label={t('until.title')} onClose={closeSheet}>
          <UntilForm label={sheet.label} action={sheet.action} />
        </Sheet>
      );
    case 'tip':
      return (
        <Sheet label={sheet.title} onClose={closeSheet}>
          <h2>{sheet.title}</h2>
          <p>{sheet.body}</p>
          <div className="actions">
            {sheet.codexId && codexById(sheet.codexId) && (
              <button className="btn ghost" onClick={() => openSheet({ kind: 'codex', id: sheet.codexId! })}>
                {t('modal.learnMore')}
              </button>
            )}
            <button className="btn primary" onClick={closeSheet}>
              {t('modal.close')}
            </button>
          </div>
        </Sheet>
      );
    case 'codex': {
      const c = codexById(sheet.id);
      if (!c) return null;
      return (
        <Sheet label={fill(c.title, g)} onClose={closeSheet}>
          <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            {t('journal.codex')} · {c.category}
          </div>
          <h2 style={{ marginTop: 4 }}>{fill(c.title, g)}</h2>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 17 }}>{fill(c.body, g)}</p>
          <div className="actions">
            <button className="btn primary" onClick={closeSheet}>
              {t('modal.close')}
            </button>
          </div>
        </Sheet>
      );
    }
    case 'settings':
      return (
        <Sheet label={t('settings.title')} onClose={closeSheet}>
          <h2>{t('settings.title')}</h2>
          <div className="stack" style={{ gap: 10 }}>
            <label className="row spread">
              <span>{t('settings.sound')}</span>
              <input type="checkbox" checked={settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
            </label>
            <label className="row spread">
              <span>{t('settings.autoEat')}</span>
              <input type="checkbox" checked={settings.autoEat} onChange={(e) => updateSettings({ autoEat: e.target.checked })} />
            </label>
            <label className="row spread">
              <span>{t('settings.confirmBatches')}</span>
              <input type="checkbox" checked={settings.confirmBatches} onChange={(e) => updateSettings({ confirmBatches: e.target.checked })} />
            </label>
            <div className="field">
              <span className="label">{t('settings.motion')}</span>
              <div className="seg" role="group" aria-label={t('settings.motion')}>
                {(['system', 'on', 'reduce'] as const).map((m) => (
                  <button key={m} aria-pressed={settings.reducedMotion === (m === 'reduce' ? 'on' : m === 'on' ? 'off' : 'system')} onClick={() => updateSettings({ reducedMotion: m === 'reduce' ? 'on' : m === 'on' ? 'off' : 'system' })}>
                    {t(m === 'system' ? 'settings.motionSystem' : m === 'on' ? 'settings.motionOn' : 'settings.motionReduce')}
                  </button>
                ))}
              </div>
            </div>
            <h3 className="section-title">{t('settings.saves')}</h3>
            <p className="small muted">{t('settings.saved', { n: slot })}</p>
            <div className="row wrap">
              <button
                className="btn small"
                onClick={() => {
                  const json = exportSave();
                  if (json) downloadText(`curbside-${g.character.name.toLowerCase().replace(/\W+/g, '-')}-day${g.day}.json`, json);
                }}
              >
                {t('settings.export')}
              </button>
              <button
                className="btn small"
                onClick={async () => {
                  const text = await pickFile();
                  if (!text) return;
                  const err = importSave(text, slot);
                  if (err) toast(t('title.importFailed', { error: err }), 'bad');
                  else closeSheet();
                }}
              >
                {t('settings.import')}
              </button>
            </div>
            <p className="tiny muted">{t('settings.seed', { seed: g.seed })}</p>
            <p className="tiny muted">{t('settings.keys')}</p>
          </div>
          <div className="actions" style={{ flexDirection: 'column' }}>
            <button className="btn" onClick={quitToTitle}>
              {t('settings.quit')}
            </button>
            <button className="btn primary" onClick={closeSheet}>
              {t('modal.close')}
            </button>
          </div>
        </Sheet>
      );
  }
}
