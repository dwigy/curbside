import { housingById } from '../../content/housing';
import { formatDate } from '../../engine/calendar';
import { netWorth } from '../../engine/selectors';
import { fill, money } from '../../engine/text';
import type { GameState } from '../../engine/types';
import { t } from '../../i18n';
import { Avatar } from '../art/Avatar';
import { Scene } from '../art/Scene';
import { downloadText } from '../persist';
import { exportSave, setState } from '../store';

export function DeathScreen({ g }: { g: GameState }) {
  const d = g.dead!;
  const age = Math.floor(d.ageDays / 365);
  const highlights = g.journal.length > 8 ? [...g.journal.slice(0, 3), ...g.journal.slice(-5)] : g.journal;
  return (
    <main className="death">
      <div className="story-art" aria-hidden>
        <Scene id="candle" />
      </div>
      <div className="main stack" style={{ paddingBottom: 40 }}>
        <div className="row" style={{ gap: 14 }}>
          <Avatar spec={g.character.avatar} size={64} title={g.character.name} />
          <div>
            <h1 style={{ fontSize: 26 }}>{t('death.title', { name: g.character.name })}</h1>
            <p className="muted">{t('death.age', { age, day: g.day })}</p>
          </div>
        </div>
        <p className="epitaph">{d.cause === 'old age' ? t('death.oldAge') : t('death.cause', { cause: d.cause })}</p>
        <section className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>{t('death.stats')}</h2>
          <div className="summary-grid">
            <div className="summary-cell"><div className="k">{t('death.days')}</div><div className="v">{g.day}</div></div>
            <div className="summary-cell"><div className="k">{t('death.earned')}</div><div className="v num">{money(Math.round(g.counters.earned ?? 0))}</div></div>
            <div className="summary-cell"><div className="k">{t('death.nw')}</div><div className="v num">{money(netWorth(g))}</div></div>
            <div className="summary-cell"><div className="k">{t('death.home')}</div><div className="v" style={{ fontSize: 14 }}>{fill(housingById(g.housing).name)}</div></div>
          </div>
        </section>
        <section className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>{t('death.journal')}</h2>
          {highlights.map((j, i) => (
            <div className="journal-entry" key={i}>
              <span className="d">{formatDate(j.day)}</span>
              {j.text}
            </div>
          ))}
        </section>
        <button className="btn primary block" onClick={() => setState({ screen: 'create', game: null, undo: null })}>
          {t('death.newLife')}
        </button>
        <button
          className="btn block"
          onClick={() => {
            const json = exportSave();
            if (json) downloadText(`curbside-${g.character.name}-life.json`, json);
          }}
        >
          {t('death.export')}
        </button>
      </div>
    </main>
  );
}
