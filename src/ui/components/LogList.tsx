import { formatDate } from '../../engine/calendar';
import type { LogEntry } from '../../engine/types';
import { t } from '../../i18n';

export function LogList({ entries }: { entries: LogEntry[] }) {
  if (!entries.length) return <p className="muted small">{t('journal.empty')}</p>;
  return (
    <ul className="loglist">
      {entries.map((l, i) => (
        <li key={`${l.day}-${i}`}>
          <span className="d">{formatDate(l.day, false).split(', ')[1]}</span>
          <span className={l.kind === 'good' ? 'good' : l.kind === 'bad' ? 'bad' : l.kind === 'warn' ? 'warn' : l.kind === 'event' ? 'warn' : ''}>{l.text}</span>
        </li>
      ))}
    </ul>
  );
}
