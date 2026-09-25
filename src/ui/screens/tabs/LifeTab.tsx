import { useState } from 'react';
import { BALANCE } from '../../../content/balance';
import { housingById } from '../../../content/housing';
import { hasItem } from '../../../engine/conditions';
import {
  currentGoal, foodAvailable, housingAvailable, housingMoveInCost, needsConfirm, visibleActivities, visibleFoods, visibleHousing,
} from '../../../engine/selectors';
import { fill, money } from '../../../engine/text';
import type { GameState, SkillKey } from '../../../engine/types';
import { t } from '../../../i18n';
import { ActionCard } from '../../components/ActionCard';
import { Bar } from '../../components/Bar';
import { Icon } from '../../components/Icons';
import { dispatch, openSheet } from '../../store';
import { LogList } from '../../components/LogList';

export function LifeTab({ g }: { g: GameState }) {
  const goal = currentGoal(g);
  const [more, setMore] = useState(false);
  const home = housingById(g.housing);

  const notices: string[] = [];
  if (g.rentDueDay !== null && g.rentArrears <= 0) notices.push(t('life.rentDue', { n: g.rentDueDay - g.day }));
  if (g.rentArrears > 0 && g.evictionDay !== null) notices.push(t('life.rentLate', { owed: money(g.rentArrears), n: g.evictionDay - g.day }));
  if (g.housing === 'shelter' && g.shelterUntil !== null) notices.push(t('life.shelterLeft', { n: g.shelterUntil - g.day }));
  for (const d of g.deliveries) if (d.itemId === 'birth_certificate') notices.push(t('life.certArrives', { n: d.arrivesDay - g.day }));

  return (
    <div className="stack" style={{ gap: 0 }}>
      {goal && (
        <section className="card goal" aria-label={t('life.goal')}>
          <div className="kicker">{t('life.goal')}</div>
          <p>{fill(goal.text, g)}</p>
        </section>
      )}
      {notices.map((n) => (
        <div key={n} className="warning-box" style={{ marginTop: 10 }}>
          <Icon.info />
          <span>{n}</span>
        </div>
      ))}

      <h2 className="section-title">
        <span>{t('life.eat')}</span>
        <span style={{ textTransform: 'none', letterSpacing: 0 }}>{t('life.eatInstant')}</span>
      </h2>
      <div className="card">
        <div className="list">
          {visibleFoods(g).map((f) => {
            const av = foodAvailable(g, f.id);
            return (
              <div className="list-item" key={f.id}>
                <div className="grow">
                  <div className="name">{fill(f.name)}</div>
                  <div className="desc">
                    +{f.food} fed · diet {f.quality}
                    {f.risk ? ` · ${Math.round(f.risk.chance * 100)}% chance of ${f.risk.health} health` : ''}
                    {!av.ok && <span className="warn"> · {av.reason}</span>}
                  </div>
                </div>
                <button className="btn small spend price" disabled={!av.ok} onClick={() => dispatch({ type: 'eat', id: f.id })} aria-label={`Eat ${fill(f.name)} for ${f.price ? money(f.price) : 'free'}`}>
                  {f.price ? money(f.price) : 'Free'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="section-title">{t('life.care')}</h2>
      {visibleActivities(g, 'life').map((a) => (
        <ActionCard key={a.id} g={g} a={a} />
      ))}

      <h2 className="section-title">{t('life.housing')}</h2>
      <div className="card">
        <div className="row spread">
          <div className="card-title">{fill(home.name)}</div>
          <span className="chip accent">{t('life.currentHome')}</span>
        </div>
        <p className="card-desc">{fill(home.desc)}</p>
        <p className="factors">{home.perks.map((p) => fill(p)).join(' · ')}</p>
        {g.housing !== 'street' && (
          <div className="action-row">
            <button
              className="btn small danger"
              onClick={() =>
                openSheet({ kind: 'confirm', title: t('life.giveUpBed'), body: t('confirm.giveUp'), confirmLabel: t('life.giveUpBed'), onConfirm: () => dispatch({ type: 'housing', id: 'street' }) })
              }
            >
              {t('life.giveUpBed')}
            </button>
          </div>
        )}
      </div>
      {visibleHousing(g)
        .filter((h) => h.tier === 'room' && h.id !== g.housing)
        .map((h) => {
          const av = housingAvailable(g, h.id);
          const cost = housingMoveInCost(h.id);
          const action = { type: 'housing' as const, id: h.id };
          return (
            <div className="card" key={h.id}>
              <div className="card-title">{fill(h.name)}</div>
              <p className="card-desc">{fill(h.desc)}</p>
              <p className="factors">{h.perks.map((p) => fill(p)).join(' · ')}</p>
              {!av.ok && (
                <p className="reason">
                  <Icon.lock />
                  <span>{av.reason}</span>
                </p>
              )}
              <div className="action-row">
                <button
                  className="btn spend block"
                  disabled={!av.ok}
                  onClick={() => {
                    if (needsConfirm(g, action))
                      openSheet({
                        kind: 'confirm',
                        title: fill(h.name),
                        body: `${t('confirm.cash', { cost: money(cost), pct: `${Math.round((cost / Math.max(1, g.cash + (g.bank ?? 0))) * 100)}%` })} Rent of ${money(h.rent)} is then due every ${BALANCE.rent.periodDays} days.`,
                        confirmLabel: t('life.moveIn', { cost: money(cost) }),
                        onConfirm: () => dispatch(action),
                      });
                    else dispatch(action);
                  }}
                >
                  {t('life.moveIn', { cost: money(cost) })}
                </button>
              </div>
            </div>
          );
        })}

      {g.dog && (
        <>
          <h2 className="section-title">{t('life.dog')}</h2>
          <div className="card">
            <div className="row spread">
              <div className="card-title">{g.dog.name || '…'}</div>
              <span className={`chip ${g.dog.foodDays > 0 ? 'good' : 'bad'}`}>
                {g.dog.foodDays > 0 ? t('life.dogFood', { n: g.dog.foodDays }) : t('life.dogHungry', { n: g.dog.hungryDays })}
              </span>
            </div>
            <div className="small muted" style={{ marginTop: 8 }}>
              {t('life.dogBond')} {Math.round(g.dog.bond)}
            </div>
            <Bar value={g.dog.bond} label={t('life.dogBond')} />
            {g.dog.foodDays <= 1 && <p className="reason">{t('life.dogBuy')}</p>}
          </div>
        </>
      )}

      <h2 className="section-title">
        <span>{t('life.skills')}</span>
        <button className="btn small ghost" onClick={() => setMore((m) => !m)} aria-expanded={more}>
          {more ? t('life.showLess') : t('life.showMore')}
        </button>
      </h2>
      <div className="card">
        <div className="row spread small">
          <button className="btn small ghost" onClick={() => openSheet({ kind: 'tip', title: t('life.diet'), body: t('tip.diet', { v: Math.round(g.diet) }), codexId: 'diet' })}>
            {t('life.diet')}: <b className="num">{Math.round(g.diet)}</b>
          </button>
          <button className="btn small ghost" onClick={() => openSheet({ kind: 'tip', title: t('life.reputation'), body: t('tip.rep', { v: Math.round(g.reputation) }), codexId: 'kindness' })}>
            {t('life.reputation')}: <b className="num">{Math.round(g.reputation)}</b>
          </button>
        </div>
        {more && (
          <div className="stack" style={{ marginTop: 10, gap: 8 }}>
            {(Object.keys(g.skills) as SkillKey[]).map((k) => (
              <div key={k}>
                <div className="row spread small">
                  <span>{t(`skill.${k}`)}</span>
                  <b className="num">{g.skills[k].toFixed(1)}</b>
                </div>
                <div className="bar">
                  <i style={{ width: `${g.skills[k]}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
            {hasItem(g, 'state_id') && <div className="small muted">State ID ✓</div>}
          </div>
        )}
      </div>

      <h2 className="section-title">{t('life.recent')}</h2>
      <div className="card">
        <LogList entries={g.log.slice(-8).reverse()} />
      </div>
    </div>
  );
}
