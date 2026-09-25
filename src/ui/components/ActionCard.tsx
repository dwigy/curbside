import { useCallback } from 'react';
import { BALANCE } from '../../content/balance';
import type { ActivityDef } from '../../content/types';
import { activityAvailable, projectHustle } from '../../engine/selectors';
import { fill, money, pct } from '../../engine/text';
import type { Action, GameState } from '../../engine/types';
import { t } from '../../i18n';
import { useHold } from '../hooks';
import { dispatch, getState, openSheet, repeatOnce, updateSettings } from '../store';
import { Icon } from './Icons';

/** Ask before anything that burns lots of days (or a batch), per the misclick rules. */
export function runWithConfirm(action: Action, times: number, label: string) {
  const { settings } = getState();
  if (times > 1 && settings.confirmBatches) {
    openSheet({
      kind: 'confirm',
      title: `${label} ×${times}`,
      body: t('confirm.batch', { n: times }),
      confirmLabel: t('modal.confirm'),
      batchNote: true,
      onConfirm: () => dispatch(action, { times }),
    });
    return;
  }
  dispatch(action, { times });
}

export function ActionCard({ g, a }: { g: GameState; a: ActivityDef }) {
  const avail = activityAvailable(g, a);
  const p = a.category === 'hustle' ? projectHustle(g, a.kind) : null;
  const action: Action = { type: 'activity', id: a.id };
  const disabled = !avail.ok;
  const days = a.days;

  const onTap = useCallback(() => {
    if (days > BALANCE.confirm.days) {
      openSheet({ kind: 'confirm', title: fill(a.name), body: t('confirm.days', { n: days }), confirmLabel: t('act.do'), onConfirm: () => dispatch(action) });
    } else dispatch(action);
  }, [a.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const onRepeat = useCallback(() => repeatOnce(action), [a.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const { holding, handlers } = useHold(onTap, onRepeat, disabled);

  const range = p ? (p.min === p.max ? money(p.min) : t('act.pays', { min: money(Math.round(p.min)), max: money(Math.round(p.max)) })) : null;
  const repeatable = a.category === 'hustle' || a.kind === 'rest' || a.kind === 'library';

  return (
    <article className="card" aria-label={fill(a.name)}>
      <div className="row spread">
        <h3 className="card-title">{fill(a.name)}</h3>
        <span className="chip">{t(days === 1 ? 'act.days' : 'act.daysPlural', { n: days })}</span>
      </div>
      <p className="card-desc">{fill(a.desc)}</p>
      <div className="meta">
        {range && <span className="chip accent num">{range}</span>}
        {p && p.chance < 1 && <span className="chip warn odds">{t('act.chance', { p: pct(p.chance) })}</span>}
        {p && <span className="chip num">{t('act.expected', { ev: money(Math.round(p.expected)) })}</span>}
        {a.energy > 0 && <span className="chip">{t('act.energy', { n: a.energy })}</span>}
      </div>
      {p && p.factors.length > 0 && (
        <p className="factors">
          {p.factors.map((f) => `${f.label} ×${f.mult.toFixed(2)}`).join(' · ')}
        </p>
      )}
      {!avail.ok && (
        <p className="reason">
          <Icon.lock />
          <span>{avail.reason}</span>
        </p>
      )}
      <div className="action-row">
        <button className={`btn primary${holding ? ' holding' : ''}`} disabled={disabled} {...handlers} aria-label={`${fill(a.name)}. ${t('act.hold')}`} title={t('act.hold')}>
          {t('act.do')}
        </button>
      </div>
      {repeatable && (
        <div className="batch-row">
          <button className="btn small ghost" disabled={disabled} onClick={() => runWithConfirm(action, 10, fill(a.name))}>
            {t('act.x10')}
          </button>
          <button className="btn small ghost" disabled={disabled} onClick={() => runWithConfirm(action, 100, fill(a.name))}>
            {t('act.x100')}
          </button>
          <button className="btn small ghost" disabled={disabled} onClick={() => openSheet({ kind: 'until', action, label: fill(a.name) })}>
            {t('act.until')}
          </button>
        </div>
      )}
    </article>
  );
}

export function dontAskBatches() {
  updateSettings({ confirmBatches: false });
}
