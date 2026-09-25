import { visibleActivities } from '../../../engine/selectors';
import { fill, pct } from '../../../engine/text';
import type { GameState } from '../../../engine/types';
import { t } from '../../../i18n';
import { ActionCard } from '../../components/ActionCard';
import { setTab, useStore } from '../../store';

export function HustleTab({ g }: { g: GameState }) {
  const autoEat = useStore((s) => s.settings.autoEat);
  const fatigue = g.spotFatigue[g.district] ?? 0;
  const hustles = visibleActivities(g, 'hustle');
  return (
    <div className="stack" style={{ gap: 0 }}>
      <div className="card">
        <div className="row spread">
          <div>
            <div className="card-title">{t('hustle.where', { district: fill(`{${g.district}}`) })}</div>
            <div className="small muted">
              {t('hustle.weather', { weather: t(`weather.${g.weather}`) })} · {autoEat ? t('hustle.autoEat') : t('hustle.autoEatOff')}
            </div>
          </div>
          {g.unlocked.city && (
            <button className="btn small ghost" onClick={() => setTab('city')}>
              {t('hustle.goCity')}
            </button>
          )}
        </div>
        {fatigue > 0.05 && <p className="reason">{t('hustle.fatigue', { pct: pct(fatigue) })}</p>}
      </div>
      <div style={{ height: 10 }} />
      {hustles.map((a) => (
        <ActionCard key={a.id} g={g} a={a} />
      ))}
      {!hustles.length && <p className="muted">{t('hustle.none')}</p>}
    </div>
  );
}
