import { NAMES } from '../../../content/config';
import { itemName, ITEMS, OWNED_ONLY } from '../../../content/items';
import { itemAvailable, needsConfirm, visibleItems } from '../../../engine/selectors';
import { fill, money } from '../../../engine/text';
import type { GameState } from '../../../engine/types';
import { t } from '../../../i18n';
import { dispatch, openSheet } from '../../store';

const SHOPS = ['thrift', 'pawn', 'corner', 'bikeShop', 'transit', 'records'] as const;
const SHOP_NAME: Record<(typeof SHOPS)[number], string> = {
  thrift: NAMES.thrift,
  pawn: NAMES.pawn,
  corner: NAMES.corner,
  bikeShop: NAMES.bikeShop,
  transit: NAMES.transit,
  records: NAMES.records.replace(/^the /, 'The '),
};

export function ShopTab({ g }: { g: GameState }) {
  const items = visibleItems(g);
  const owned = Object.keys(g.items).filter((id) => g.items[id] > 0);
  const buy = (id: string) => {
    const def = ITEMS.find((i) => i.id === id)!;
    const action = { type: 'buy' as const, id };
    if (needsConfirm(g, action)) {
      const funds = g.cash + (g.bank ?? 0);
      openSheet({
        kind: 'confirm',
        title: def.name,
        body: `${def.desc} ${t('confirm.cash', { cost: money(def.price), pct: `${Math.round((def.price / Math.max(1, funds)) * 100)}%` })}`,
        confirmLabel: `${t('shop.buy')} · ${money(def.price)}`,
        onConfirm: () => dispatch(action),
      });
    } else dispatch(action);
  };

  return (
    <div className="stack" style={{ gap: 0 }}>
      {SHOPS.map((shop) => {
        const list = items.filter((i) => i.shop === shop);
        if (!list.length) return null;
        return (
          <section key={shop}>
            <h2 className="section-title">{SHOP_NAME[shop]}</h2>
            <div className="card">
              <div className="list">
                {list.map((i) => {
                  const av = itemAvailable(g, i.id);
                  const renew = !!i.expiresDays && (g.items[i.id] ?? 0) > 0;
                  return (
                    <div className="list-item" key={i.id}>
                      <div className="grow">
                        <div className="name">{i.name}</div>
                        <div className="desc">{fill(i.desc)}</div>
                        {i.expiresDays && g.expiries[i.id] !== undefined && <div className="tiny accent">{t('shop.expires', { n: g.expiries[i.id] - g.day })}</div>}
                        {!av.ok && <div className="tiny warn">{av.reason}</div>}
                      </div>
                      <button className="btn small spend price" disabled={!av.ok} onClick={() => buy(i.id)} aria-label={`${renew ? t('shop.renew') : t('shop.buy')} ${i.name} for ${money(i.price)}`}>
                        {money(i.price)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
      <h2 className="section-title">{t('shop.owned')}</h2>
      <div className="card">
        {owned.length === 0 && !g.deliveries.length ? (
          <p className="muted small">{t('shop.nothing')}</p>
        ) : (
          <div className="list">
            {owned.map((id) => (
              <div className="list-item" key={id}>
                <div className="grow">
                  <div className="name">
                    {itemName(id)}
                    {g.items[id] > 1 ? ` ×${g.items[id]}` : ''}
                  </div>
                  <div className="desc">{fill(ITEMS.find((i) => i.id === id)?.desc ?? OWNED_ONLY[id]?.desc ?? '')}</div>
                </div>
                {g.expiries[id] !== undefined && <span className="chip">{t('shop.expires', { n: g.expiries[id] - g.day })}</span>}
              </div>
            ))}
            {g.deliveries.map((d) => (
              <div className="list-item" key={d.itemId}>
                <div className="grow">
                  <div className="name">{itemName(d.itemId)}</div>
                  <div className="desc">{t('shop.ordered', { n: d.arrivesDay - g.day })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
