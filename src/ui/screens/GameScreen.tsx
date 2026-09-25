import { prosperity } from '../../engine/selectors';
import type { GameState, TabId } from '../../engine/types';
import { BottomNav } from '../components/BottomNav';
import { Overlays } from '../components/Overlays';
import { TopBar } from '../components/TopBar';
import { useStore } from '../store';
import { CityTab } from './tabs/CityTab';
import { HustleTab } from './tabs/HustleTab';
import { JournalTab } from './tabs/JournalTab';
import { LifeTab } from './tabs/LifeTab';
import { MoneyTab } from './tabs/MoneyTab';
import { ShopTab } from './tabs/ShopTab';
import { DeathScreen } from './DeathScreen';
import { useEffect } from 'react';
import { applyTheme } from '../theme';

const TABS: Record<TabId, (p: { g: GameState }) => React.ReactElement> = {
  life: LifeTab,
  hustle: HustleTab,
  shop: ShopTab,
  money: MoneyTab,
  city: CityTab,
  journal: JournalTab,
};

export function GameScreen({ g }: { g: GameState }) {
  const tab = useStore((s) => s.tab);
  const pulse = useStore((s) => s.dayPulse);
  const p = prosperity(g);
  useEffect(() => applyTheme(p), [p]);

  // Death waits until the last story card or event has been seen.
  if (g.dead && !g.pendingStory.length && !g.pendingEvent) return <DeathScreen g={g} />;
  const active: TabId = g.unlocked[tab] ? tab : 'life';
  const Tab = TABS[active];
  return (
    <>
      <TopBar g={g} />
      <main className="main" id="main">
        <Tab g={g} />
      </main>
      <BottomNav g={g} />
      {pulse > 0 && <div key={pulse} className="daylight" aria-hidden />}
      <Overlays g={g} />
    </>
  );
}
