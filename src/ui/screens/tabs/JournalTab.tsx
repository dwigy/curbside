import { CODEX } from '../../../content/codex';
import { formatDate } from '../../../engine/calendar';
import { fill } from '../../../engine/text';
import type { GameState } from '../../../engine/types';
import { t } from '../../../i18n';
import { LogList } from '../../components/LogList';
import { openSheet } from '../../store';

export function JournalTab({ g }: { g: GameState }) {
  const known = CODEX.filter((c) => g.codex.includes(c.id));
  return (
    <div className="stack" style={{ gap: 0 }}>
      <h2 className="section-title">{t('journal.title')}</h2>
      <div className="card">
        {g.journal.length === 0 && <p className="muted small">{t('journal.empty')}</p>}
        {[...g.journal].reverse().map((j, i) => (
          <div className="journal-entry" key={i}>
            <span className="d">{formatDate(j.day)}</span>
            {j.text}
          </div>
        ))}
      </div>
      <h2 className="section-title">
        <span>{t('journal.codex')}</span>
        <span className="tiny" style={{ textTransform: 'none', letterSpacing: 0 }}>
          {known.length}/{CODEX.length}
        </span>
      </h2>
      <div className="card">
        <p className="small muted" style={{ marginBottom: 6 }}>{t('journal.codexHint')}</p>
        <div className="list">
          {known.map((c) => (
            <button key={c.id} className="list-item" style={{ background: 'none', border: 0, borderTop: '1px solid var(--line)', textAlign: 'left', width: '100%' }} onClick={() => openSheet({ kind: 'codex', id: c.id })}>
              <div className="grow">
                <div className="name">{fill(c.title, g)}</div>
                <div className="desc">{c.category}</div>
              </div>
              <span aria-hidden>›</span>
            </button>
          ))}
        </div>
      </div>
      <h2 className="section-title">{t('journal.log')}</h2>
      <div className="card">
        <LogList entries={[...g.log].reverse().slice(0, 80)} />
      </div>
    </div>
  );
}
