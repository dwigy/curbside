import { BALANCE } from '../../content/balance';
import { formatDate, formatSpan, seasonOf } from '../../engine/calendar';
import { ageDays, daysLeft, lifeBurnRate, lifeTrend, theftChance, tierOf } from '../../engine/selectors';
import { money, pct } from '../../engine/text';
import type { GameState } from '../../engine/types';
import { hasItem } from '../../engine/conditions';
import { t } from '../../i18n';
import { openSheet, undo, useStore } from '../store';
import { Tick } from './Anim';
import { Bar } from './Bar';
import { Icon } from './Icons';

const TREND = { down: '▼', up: '▲', flat: '▶' } as const;

export function TopBar({ g }: { g: GameState }) {
  const canUndo = useStore((s) => !!s.undo && !g.flags.ironMode);
  const left = daysLeft(g);
  const trend = lifeTrend(g);
  const age = Math.floor(ageDays(g) / 365);
  const tip = (title: string, body: string, codexId?: string) => openSheet({ kind: 'tip', title, body, codexId });
  const sleep = BALANCE.needs.sleep[tierOf(g)] + (tierOf(g) === 'street' && hasItem(g, 'sleeping_bag') ? BALANCE.needs.sleepingBagBonus : 0);
  const lifeClass = left < 90 ? 'bad' : left < 365 ? 'warn' : '';

  return (
    <header className="topbar">
      <div className="topbar-row">
        <button
          className="stat-chip grow"
          onClick={() =>
            tip(
              t('tip.cash.title'),
              t('tip.cash', {
                cash: money(g.cash),
                risk: pct(theftChance(g)),
                bank: g.bank !== null ? t('tip.cash.bank', { bank: money(g.bank) }) : t('tip.cash.nobank'),
              }),
              'theft',
            )
          }
          aria-label={`${t('top.cash')}: ${money(g.cash)}`}
        >
          <span className="label">{t('top.cash')}</span>
          <span className="value">
            <Tick value={g.cash}>{money(g.cash)}</Tick>
          </span>
          <span className="sub">{g.bank !== null ? t('top.bank', { bank: money(g.bank) }) : '\u00a0'}</span>
        </button>
        <button
          className="stat-chip life-chip grow"
          onClick={() =>
            tip(
              t('tip.life.title'),
              t('tip.life', {
                left: formatSpan(left),
                age,
                expected: Math.floor(g.lifeExpectancyDays / 365),
                n: Math.max(1, g.lifeHistory.length - 1),
                rate: lifeBurnRate(g).toFixed(1),
              }),
              'clock',
            )
          }
          aria-label={`${t('top.life')}: ${formatSpan(left)}, trend ${trend}`}
        >
          <span className="label">{t('top.life')}</span>
          <span className={`value ${lifeClass}`}>
            {formatSpan(left)}
            <span className={`trend ${trend}`} aria-hidden>
              {TREND[trend]}
            </span>
          </span>
          <span className="sub">{`${lifeBurnRate(g).toFixed(1)}× pace`}</span>
        </button>
        <div className="row" style={{ gap: 6 }}>
          <button className="icon-btn" onClick={undo} disabled={!canUndo} aria-label={t('top.undo')} title={t('top.undo')}>
            <Icon.undo />
          </button>
          <button className="icon-btn" onClick={() => openSheet({ kind: 'settings' })} aria-label={t('top.menu')} title={t('top.menu')}>
            <Icon.menu />
          </button>
        </div>
      </div>
      <button
        className="dateline"
        onClick={() =>
          tip(
            t('tip.date.title'),
            t('tip.date', { date: formatDate(g.day), season: t(`season.${seasonOf(g.day)}`), weather: t(`weather.${g.weather}`) }),
            'weather',
          )
        }
      >
        {formatDate(g.day)} · {t(`season.${seasonOf(g.day)}`)} · {t(`weather.${g.weather}`)} · {t('top.age', { age })}
      </button>
      <div className="bars">
        {(
          [
            ['health', t('top.health'), t('tip.health.title'), t('tip.health', { v: Math.round(g.stats.health) }), 'needs'],
            ['happiness', t('top.happy'), t('tip.happy.title'), t('tip.happy', { v: Math.round(g.stats.happiness) }), 'needs'],
            ['food', t('top.fed'), t('tip.fed.title'), t('tip.fed', { v: Math.round(g.stats.food) }), 'diet'],
            ['energy', t('top.energy'), t('tip.energy.title'), t('tip.energy', { v: Math.round(g.stats.energy), sleep }), 'needs'],
          ] as const
        ).map(([k, label, title, body, codex]) => (
          <button key={k} className="mini" onClick={() => tip(title, body, codex)} aria-label={`${label} ${Math.round(g.stats[k])} of 100`}>
            <span className="mini-top">
              <span>{label}</span>
              <b>{Math.round(g.stats[k])}</b>
            </span>
            <Bar value={g.stats[k]} label={label} />
          </button>
        ))}
      </div>
    </header>
  );
}
