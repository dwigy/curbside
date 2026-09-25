import { useEffect, useRef } from 'react';
import type { TabId } from '../engine/types';
import { DebugMenu } from './debug/DebugMenu';
import { CreateScreen } from './screens/CreateScreen';
import { GameScreen } from './screens/GameScreen';
import { TitleScreen } from './screens/TitleScreen';
import { getState, setState, setTab, undo, useStore } from './store';
import { applyTheme } from './theme';

const TAB_KEYS: TabId[] = ['life', 'hustle', 'shop', 'money', 'city', 'journal'];

export function App() {
  const screen = useStore((s) => s.screen);
  const game = useStore((s) => s.game);
  const debugOpen = useStore((s) => s.debugOpen);
  const toast = useStore((s) => s.toast);
  const motion = useStore((s) => s.settings.reducedMotion);
  const taps = useRef<number[]>([]);

  useEffect(() => {
    if (screen !== 'game') applyTheme(0.15);
    window.scrollTo({ top: 0 });
  }, [screen]);

  useEffect(() => {
    const el = document.documentElement;
    if (motion === 'on') el.dataset.motion = 'reduce';
    else if (motion === 'off') el.dataset.motion = 'on';
    else delete el.dataset.motion;
  }, [motion]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('debug') === '1') setState({ debugOpen: true });
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select')) return;
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setState((s) => ({ debugOpen: !s.debugOpen }));
        return;
      }
      if (e.key === 'Escape' && getState().debugOpen) {
        setState({ debugOpen: false });
        return;
      }
      const st = getState();
      if (st.screen !== 'game' || !st.game || st.sheet || st.debugOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'z' || e.key === 'Z') undo();
      const n = Number(e.key);
      if (n >= 1 && n <= 6) {
        const visible = TAB_KEYS.filter((id) => st.game!.unlocked[id]);
        if (visible[n - 1]) setTab(visible[n - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onVersionTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((x) => now - x < 3000), now];
    if (taps.current.length >= 7) {
      taps.current = [];
      setState({ debugOpen: true });
    }
  };

  return (
    <div className="app">
      <a href="#main" className="sr-only">
        Skip to game
      </a>
      {screen === 'title' && <TitleScreen onVersionTap={onVersionTap} />}
      {screen === 'create' && <CreateScreen />}
      {screen === 'game' && game && <GameScreen g={game} />}
      {toast && (
        <div className={`toast ${toast.tone}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}
      {debugOpen && <DebugMenu />}
    </div>
  );
}
