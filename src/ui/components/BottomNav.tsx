import { useEffect, useRef, useState } from 'react';
import type { GameState, TabId } from '../../engine/types';
import { t } from '../../i18n';
import { setTab, toast, useStore } from '../store';
import { Icon } from './Icons';

const TABS: TabId[] = ['life', 'hustle', 'shop', 'money', 'city', 'journal'];

export function BottomNav({ g }: { g: GameState }) {
  const tab = useStore((s) => s.tab);
  const visible = TABS.filter((id) => g.unlocked[id]);
  const seen = useRef<Set<TabId>>(new Set(visible));
  const [fresh, setFresh] = useState<Set<TabId>>(new Set());

  useEffect(() => {
    const added = visible.filter((id) => !seen.current.has(id));
    if (added.length) {
      added.forEach((id) => seen.current.add(id));
      setFresh((f) => new Set([...f, ...added]));
      toast(t('tab.new', { tab: t(`tab.${added[0]}`) }), 'good');
    }
  }, [visible.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <nav className="nav" aria-label="Sections">
      <div className="nav-inner">
        {visible.map((id, i) => {
          const I = Icon[id];
          return (
            <button
              key={id}
              aria-current={tab === id ? 'page' : undefined}
              aria-keyshortcuts={String(i + 1)}
              onClick={() => {
                setTab(id);
                setFresh((f) => {
                  const n = new Set(f);
                  n.delete(id);
                  return n;
                });
                window.scrollTo({ top: 0 });
              }}
            >
              <I />
              {t(`tab.${id}`)}
              {fresh.has(id) && <span className="new-dot" aria-label="new" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
