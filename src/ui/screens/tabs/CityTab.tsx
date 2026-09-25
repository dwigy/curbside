import { CAST } from '../../../content/cast';
import { NAMES } from '../../../content/config';
import { DISTRICTS } from '../../../content/districts';
import { check } from '../../../engine/conditions';
import { travelAvailable, travelDays } from '../../../engine/selectors';
import { fill } from '../../../engine/text';
import type { DistrictId, GameState } from '../../../engine/types';
import { t } from '../../../i18n';
import { CityMap } from '../../art/CityMap';
import { Bar } from '../../components/Bar';
import { dispatch } from '../../store';

const MET: Record<string, (g: GameState) => boolean> = {
  ines: (g) => 'meet_ines' in g.beats,
  wick: (g) => 'meet_wick' in g.beats,
  priya: (g) => 'meet_priya' in g.beats,
  grace: (g) => 'meet_grace' in g.beats,
  albescu: (g) => g.housing === 'room_albescu' || (g.relationships.albescu ?? 0) !== 0,
  jaylen: (g) => (g.relationships.jaylen ?? 0) !== 0,
  rafe: () => false,
};

export function CityTab({ g }: { g: GameState }) {
  const open = Object.fromEntries(DISTRICTS.map((d) => [d.id, !!d.open && check(d.open, g)])) as Record<DistrictId, boolean>;
  const labels = Object.fromEntries(DISTRICTS.map((d) => [d.id, fill(`{${d.id}}`).replace(/^the /, '')])) as Record<DistrictId, string>;
  const go = (to: DistrictId) => dispatch({ type: 'travel', to });
  const days = travelDays(g);
  return (
    <div className="stack" style={{ gap: 0 }}>
      <div className="map-wrap">
        <CityMap current={g.district} open={open} labels={labels} onSelect={(id) => travelAvailable(g, id).ok && go(id)} />
      </div>
      <h2 className="section-title">{NAMES.city}</h2>
      {DISTRICTS.map((d) => {
        const av = travelAvailable(g, d.id);
        const here = d.id === g.district;
        return (
          <div className="card" key={d.id} style={{ opacity: open[d.id] ? 1 : 0.6 }}>
            <div className="row spread">
              <div className="card-title">{labels[d.id]}</div>
              {here ? <span className="chip accent">{t('city.here')}</span> : !open[d.id] ? <span className="chip">{t('city.locked')}</span> : null}
            </div>
            <p className="card-desc">{fill(d.blurb)}</p>
            {!here && open[d.id] && (
              <div className="action-row">
                <button className="btn primary" disabled={!av.ok} onClick={() => go(d.id)}>
                  {t('city.travel', { district: labels[d.id] })} · {days ? t('city.walk') : t('city.bus')}
                </button>
              </div>
            )}
            {!open[d.id] && <p className="reason">{d.lockedReason}</p>}
          </div>
        );
      })}
      <h2 className="section-title">{t('city.people')}</h2>
      <div className="card">
        <div className="list">
          {CAST.filter((c) => MET[c.id]?.(g)).map((c) => (
            <div className="list-item" key={c.id}>
              <div className="grow">
                <div className="name">{fill(`{${c.id}}`)}</div>
                <div className="desc">{fill(c.role)}. {fill(c.blurb)}</div>
                <div style={{ marginTop: 6 }}>
                  <Bar value={50 + (g.relationships[c.id] ?? 0) / 2} label={`Relationship with ${fill(`{${c.id}}`)}`} />
                </div>
              </div>
              <span className="num small">{Math.round(g.relationships[c.id] ?? 0)}</span>
            </div>
          ))}
          {!CAST.some((c) => MET[c.id]?.(g)) && <p className="muted small">{t('cast.unknown')}</p>}
        </div>
      </div>
    </div>
  );
}
