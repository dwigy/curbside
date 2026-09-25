import { useMemo, useState } from 'react';
import { ITEMS, OWNED_ONLY } from '../../content/items';
import { BEATS, STORY_CARDS } from '../../content/story';
import { simulate, STRATEGIES, type SimReport, type Strategy } from '../../engine/bot';
import { formatDate, formatSpan } from '../../engine/calendar';
import { debug } from '../../engine/debug';
import { newGame } from '../../engine/newGame';
import { deserialize } from '../../engine/save';
import { daysLeft, eventChanceToday } from '../../engine/selectors';
import { ALL_EVENTS } from '../../engine/sim';
import { money } from '../../engine/text';
import type { CastId, SkillKey, StatKey } from '../../engine/types';
import { deleteSlot, downloadText, pickFile } from '../persist';
import { applyDebug, exportSave, getState, importSave, quitToTitle, setState, toast, useStore } from '../store';

const STATS: StatKey[] = ['health', 'happiness', 'food', 'energy'];
const SKILLS: SkillKey[] = ['streetSmarts', 'charisma', 'trade', 'business', 'music'];
const CAST: CastId[] = ['ines', 'wick', 'priya', 'albescu', 'grace', 'jaylen', 'rafe'];

type Panel = 'state' | 'ledger' | 'inspect' | 'sim';

function B({ label, on }: { label: string; on: () => void }) {
  return (
    <button className="dbtn" onClick={on}>
      {label}
    </button>
  );
}

export function DebugMenu() {
  const g = useStore((s) => s.game);
  const slot = useStore((s) => s.slot);
  const [panel, setPanel] = useState<Panel>('state');
  const [num, setNum] = useState('100');
  const [eventId, setEventId] = useState(ALL_EVENTS[0]?.id ?? '');
  const [item, setItem] = useState('state_id');
  const [beat, setBeat] = useState(BEATS[0].id);
  const [card, setCard] = useState(STORY_CARDS[0].id);
  const [strategy, setStrategy] = useState<Strategy>('climber');
  const [runs, setRuns] = useState('10');
  const [years, setYears] = useState('5');
  const [report, setReport] = useState<SimReport | null>(null);
  const [filter, setFilter] = useState('');
  const n = Number(num) || 0;
  const close = () => setState({ debugOpen: false });
  const events = useMemo(() => ALL_EVENTS.map((e) => e.id).sort(), []);
  const allItems = useMemo(() => [...ITEMS.map((i) => i.id), ...Object.keys(OWNED_ONLY)], []);

  return (
    <div className="debug" role="dialog" aria-modal="true" aria-label="Debug menu">
      <div className="grid" style={{ justifyContent: 'space-between' }}>
        <h2>DEBUG</h2>
        <B label="close ✕" on={close} />
      </div>
      {!g ? (
        <p>No game loaded. Start or load a life first. Balance sim still works below.</p>
      ) : (
        <p>
          {g.character.name} · day {g.day} ({formatDate(g.day)}) · left {formatSpan(daysLeft(g))} · seed {g.seed} · rng {g.rng} · events {g.eventsEnabled ? 'ON' : 'OFF'} ({(eventChanceToday(g) * 100).toFixed(0)}%/day) · debugUsed {String(g.debugUsed)}
        </p>
      )}
      <div className="grid" style={{ marginTop: 8 }}>
        {(['state', 'ledger', 'inspect', 'sim'] as Panel[]).map((p) => (
          <button key={p} className="dbtn" style={panel === p ? { borderColor: '#9fe3a1', color: '#9fe3a1' } : undefined} onClick={() => setPanel(p)}>
            {p}
          </button>
        ))}
      </div>

      {g && panel === 'state' && (
        <>
          <h3>Value</h3>
          <div className="grid">
            <input value={num} onChange={(e) => setNum(e.target.value)} inputMode="numeric" style={{ width: 100 }} aria-label="value" />
            <span>used by buttons below</span>
          </div>
          <h3>Money</h3>
          <div className="grid">
            <B label={`+cash ${n}`} on={() => applyDebug((s) => debug.addCash(s, n))} />
            <B label={`-cash ${n}`} on={() => applyDebug((s) => debug.addCash(s, -n))} />
            <B label="open bank" on={() => applyDebug((s) => ({ ...debug.apply(s, {}), bank: s.bank ?? 0 }))} />
          </div>
          <h3>Stats (set to value)</h3>
          <div className="grid">
            {STATS.map((k) => (
              <B key={k} label={`${k}=${n}`} on={() => applyDebug((s) => debug.setStat(s, k, n))} />
            ))}
            <B label={`rep=${n}`} on={() => applyDebug((s) => debug.setReputation(s, n))} />
            <B label={`daysLeft=${n}`} on={() => applyDebug((s) => debug.setDaysLeft(s, n))} />
          </div>
          <h3>Skills (set to value)</h3>
          <div className="grid">
            {SKILLS.map((k) => (
              <B key={k} label={`${k}=${n}`} on={() => applyDebug((s) => debug.setSkill(s, k, n))} />
            ))}
          </div>
          <h3>Relationships (set to value)</h3>
          <div className="grid">
            {CAST.map((k) => (
              <B key={k} label={`${k}=${n}`} on={() => applyDebug((s) => debug.setRel(s, k, n))} />
            ))}
          </div>
          <h3>Time</h3>
          <div className="grid">
            <B label={`fast-forward ${n} days`} on={() => applyDebug((s) => debug.fastForward(s, Math.min(n, 3650)))} />
            <B label="+7 days" on={() => applyDebug((s) => debug.fastForward(s, 7))} />
            <B label="+30 days" on={() => applyDebug((s) => debug.fastForward(s, 30))} />
            <B label="+365 days" on={() => applyDebug((s) => debug.fastForward(s, 365))} />
          </div>
          <h3>Events</h3>
          <div className="grid">
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label="event">
              {events.map((id) => (
                <option key={id}>{id}</option>
              ))}
            </select>
            <B label="trigger now" on={() => applyDebug((s) => debug.triggerEvent(s, eventId))} />
            <B label="force next" on={() => applyDebug((s) => debug.forceNextEvent(s, eventId))} />
            <B label={`toggle events (${g.eventsEnabled ? 'on' : 'off'})`} on={() => applyDebug((s) => debug.toggleEvents(s))} />
            <B label="clear blocking" on={() => applyDebug((s) => debug.clearBlocking(s))} />
          </div>
          <h3>Items</h3>
          <div className="grid">
            <select value={item} onChange={(e) => setItem(e.target.value)} aria-label="item">
              {allItems.map((id) => (
                <option key={id}>{id}</option>
              ))}
            </select>
            <B label="grant" on={() => applyDebug((s) => debug.grantItem(s, item))} />
            <B label="remove" on={() => applyDebug((s) => debug.removeItem(s, item))} />
            <B label="get dog" on={() => applyDebug((s) => debug.apply(s, { getDog: true }))} />
            <B label="unlock all tabs" on={() => applyDebug((s) => debug.unlockAll(s))} />
          </div>
          <h3>Story</h3>
          <div className="grid">
            <select value={beat} onChange={(e) => setBeat(e.target.value)} aria-label="beat">
              {BEATS.map((b) => (
                <option key={b.id}>{b.id}</option>
              ))}
            </select>
            <B label="jump to beat" on={() => applyDebug((s) => debug.jumpToBeat(s, beat))} />
            <select value={card} onChange={(e) => setCard(e.target.value)} aria-label="story card">
              {STORY_CARDS.map((c) => (
                <option key={c.id}>{c.id}</option>
              ))}
            </select>
            <B label="show card" on={() => applyDebug((s) => debug.apply(s, { story: [card] }))} />
            <B label={`set act ${n}`} on={() => applyDebug((s) => debug.setAct(s, n))} />
          </div>
          <h3>Life & death</h3>
          <div className="grid">
            <B label="kill character" on={() => { applyDebug((s) => debug.kill(s)); close(); }} />
            <B label="revive (+5y)" on={() => applyDebug((s) => debug.revive(s))} />
            <span>(heirs arrive with the Legacy milestone)</span>
          </div>
          <h3>Seed</h3>
          <div className="grid">
            <B label={`set rng state = ${n}`} on={() => applyDebug((s) => debug.setSeed(s, n))} />
            <B
              label="replay from this seed (new life, same character)"
              on={() => {
                const s = getState().game!;
                const fresh = newGame({ name: s.character.name, pronouns: s.character.pronouns, avatar: s.character.avatar, backstory: s.character.backstory, seed: s.seed });
                applyDebug(() => ({ ...fresh, debugUsed: true }));
                toast(`Replaying seed ${s.seed}`);
              }}
            />
          </div>
          <h3>Save</h3>
          <div className="grid">
            <B label="export JSON" on={() => { const j = exportSave(); if (j) downloadText(`curbside-debug-day${g.day}.json`, j); }} />
            <B
              label="import JSON"
              on={async () => {
                const text = await pickFile();
                if (!text) return;
                try {
                  deserialize(text);
                  importSave(text, slot);
                } catch (e) {
                  toast(String(e), 'bad');
                }
              }}
            />
            <B label={`wipe slot ${slot}`} on={() => { if (confirm(`Wipe slot ${slot}?`)) { deleteSlot(slot); quitToTitle(); close(); } }} />
          </div>
        </>
      )}

      {g && panel === 'ledger' && (
        <>
          <h3>Ledger (last {g.ledger.length}) · totals cash {money(g.ledgerTotals.cash)} bank {money(g.ledgerTotals.bank)}</h3>
          <p>
            reconcile: opening {money(g.opening.cash)} + totals {money(g.ledgerTotals.cash)} = {money(g.opening.cash + g.ledgerTotals.cash)} vs cash {money(g.cash)}{' '}
            {Math.abs(g.opening.cash + g.ledgerTotals.cash - g.cash) < 0.011 ? '✓' : '✗ MISMATCH'}
          </p>
          <table>
            <tbody>
              {[...g.ledger].reverse().map((l, i) => (
                <tr key={i}>
                  <td>d{l.day}</td>
                  <td>{l.account}</td>
                  <td className={l.amount >= 0 ? 'pos' : 'neg'}>{money(l.amount)}</td>
                  <td>{l.balance}</td>
                  <td>{l.category}</td>
                  <td>{l.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {g && panel === 'inspect' && (
        <>
          <h3>State inspector</h3>
          <input placeholder="filter top-level keys" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <pre>
            {JSON.stringify(
              Object.fromEntries(Object.entries(g).filter(([k]) => !filter || k.toLowerCase().includes(filter.toLowerCase())).map(([k, v]) => [k, k === 'log' || k === 'ledger' ? `[${(v as unknown[]).length} entries]` : v])),
              null,
              1,
            )}
          </pre>
        </>
      )}

      {panel === 'sim' && (
        <>
          <h3>Balance simulator</h3>
          <div className="grid">
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)} aria-label="strategy">
              {STRATEGIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <label>
              runs <input value={runs} onChange={(e) => setRuns(e.target.value)} style={{ width: 60 }} />
            </label>
            <label>
              years <input value={years} onChange={(e) => setYears(e.target.value)} style={{ width: 60 }} />
            </label>
            <B
              label="run"
              on={() => {
                setReport(null);
                setTimeout(() => setReport(simulate(strategy, Math.min(200, Number(runs) || 10), 1000, 365 * Math.min(80, Number(years) || 5))), 20);
              }}
            />
          </div>
          {report && (
            <pre>
              {`strategy ${report.strategy} · runs ${report.runs}
days left at start ${report.medianDaysLeftAtStart}
median death age ${report.medianDeathAge ?? '—'}
reached a room ${report.reachedRoom}/${report.runs} · median day ${report.medianRoomDay ?? '—'}
causes of death ${JSON.stringify(report.causes)}
median net worth by year:
${report.medianNetWorthByYear.map((v, i) => `  year ${i + 1}: ${money(v)}`).join('\n')}`}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
