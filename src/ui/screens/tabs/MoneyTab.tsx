import { useState } from 'react';
import { BALANCE } from '../../../content/balance';
import { housingById } from '../../../content/housing';
import { itemName } from '../../../content/items';
import { formatDate } from '../../../engine/calendar';
import { bankAvailable, netWorth, theftChance } from '../../../engine/selectors';
import { fill, money, pct } from '../../../engine/text';
import type { GameState } from '../../../engine/types';
import { t } from '../../../i18n';
import { dispatch, openSheet } from '../../store';

export function MoneyTab({ g }: { g: GameState }) {
  const [amount, setAmount] = useState('');
  const amt = Math.round(Number(amount) * 100) / 100;
  const bills: { what: string; when: string; amount?: number }[] = [];
  if (g.rentDueDay !== null) bills.push({ what: `Rent: ${fill(housingById(g.housing).name)}`, when: `in ${g.rentDueDay - g.day} days`, amount: housingById(g.housing).rent });
  if (g.rentArrears > 0) bills.push({ what: 'Rent owed (late)', when: `evicted in ${(g.evictionDay ?? g.day) - g.day} days`, amount: g.rentArrears });
  for (const [id, until] of Object.entries(g.expiries)) bills.push({ what: itemName(id), when: `runs out in ${until - g.day} days (renew in Shop)` });
  if (g.flags.collectionsDebt) bills.push({ what: 'Old business debt (in collections)', when: 'dormant until Act II', amount: Number(g.flags.collectionsDebt) });

  return (
    <div className="stack" style={{ gap: 0 }}>
      <div className="card">
        <div className="row spread">
          <div>
            <div className="small muted">{t('money.onHand')}</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 700 }}>{money(g.cash)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="small muted">{g.bank !== null ? t('money.inBank') : t('money.noBank')}</div>
            <div className="num" style={{ fontSize: 26, fontWeight: 700 }}>{g.bank !== null ? money(g.bank) : '—'}</div>
          </div>
        </div>
        <p className="small" style={{ marginTop: 8 }}>
          <span className={theftChance(g) > 0.01 ? 'warn' : 'muted'}>{t('money.theft', { p: pct(theftChance(g)) })}</span>{' '}
          <span className="muted">{t('money.theftNote')}</span>
        </p>
        <p className="small muted">{t('money.netWorth', { nw: money(netWorth(g)) })}</p>

        {g.bank === null ? (
          <div className="action-row">
            {(() => {
              const av = bankAvailable(g, 'open', 0);
              return (
                <div className="grow">
                  <button className="btn primary block" disabled={!av.ok} onClick={() => dispatch({ type: 'bank', op: 'open', amount: 0 })}>
                    {t('money.open', { min: money(BALANCE.bank.minOpeningDeposit) })}
                  </button>
                  {!av.ok && <p className="reason">{av.reason}</p>}
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <label className="field">
              <span className="label">{t('money.amount')}</span>
              <input className="input num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" />
            </label>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {[10, 50, 100].map((v) => (
                <button key={v} className="btn small ghost" onClick={() => setAmount(String(v))}>
                  {money(v)}
                </button>
              ))}
              <button className="btn small ghost" onClick={() => setAmount(String(Math.floor(g.cash * 100) / 100))}>
                {t('money.all')}
              </button>
            </div>
            <div className="action-row">
              <button className="btn primary" disabled={!bankAvailable(g, 'deposit', amt).ok} onClick={() => dispatch({ type: 'bank', op: 'deposit', amount: amt }) && setAmount('')}>
                {t('money.deposit')}
              </button>
              <button className="btn" style={{ flex: 1 }} disabled={!bankAvailable(g, 'withdraw', amt).ok} onClick={() => dispatch({ type: 'bank', op: 'withdraw', amount: amt }) && setAmount('')}>
                {t('money.withdraw')}
              </button>
            </div>
          </div>
        )}
      </div>

      <h2 className="section-title">{t('money.bills')}</h2>
      <div className="card">
        {bills.length === 0 ? (
          <p className="muted small">{t('money.noBills')}</p>
        ) : (
          <div className="list">
            {bills.map((b) => (
              <div className="list-item" key={b.what}>
                <div className="grow">
                  <div className="name">{b.what}</div>
                  <div className="desc">{b.when}</div>
                </div>
                {b.amount !== undefined && <span className="price num">{money(b.amount)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="section-title">
        <span>{t('money.ledger')}</span>
        <button className="btn small ghost" onClick={() => openSheet({ kind: 'codex', id: 'habit' })}>?</button>
      </h2>
      <div className="card">
        {g.ledger.length === 0 ? (
          <p className="muted small">{t('money.ledgerEmpty')}</p>
        ) : (
          <ul className="loglist">
            {g.ledger
              .slice(-60)
              .reverse()
              .map((l, i) => (
                <li key={i}>
                  <span className="d">{formatDate(l.day, false).split(', ')[1]}</span>
                  <span className="grow">
                    {l.reason}
                    <span className="tiny muted"> · {l.account}</span>
                  </span>
                  <b className={`num ${l.amount >= 0 ? 'good' : 'bad'}`}>
                    {l.amount >= 0 ? '+' : ''}
                    {money(l.amount)}
                  </b>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
