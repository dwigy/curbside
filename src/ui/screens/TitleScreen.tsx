import { useState } from 'react';
import { GAME_VERSION, NAMES } from '../../content/config';
import { t } from '../../i18n';
import { Scene } from '../art/Scene';
import { deleteSlot, lastSlot, pickFile, slotMeta, SLOTS } from '../persist';
import { importSave, loadGame, openSheet, setState, toast } from '../store';
import { Sheet } from '../components/Sheet';

export function TitleScreen({ onVersionTap }: { onVersionTap: () => void }) {
  const [, force] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const last = lastSlot();
  const lastMeta = last ? slotMeta(last) : null;
  const firstEmpty = SLOTS.find((s) => !slotMeta(s)) ?? 1;
  void openSheet;

  const startNew = (slot: number) => setState({ slot, screen: 'create' });

  return (
    <main className="title-screen">
      <div className="title-hero" aria-hidden>
        <Scene id="overpass" />
      </div>
      <div className="title-body">
        <h1 className="logo">
          {NAMES.game.slice(0, 4)}
          <span>{NAMES.game.slice(4)}</span>
        </h1>
        <p className="tagline">{NAMES.tagline}</p>

        {lastMeta && !lastMeta.dead && (
          <button className="btn primary block" onClick={() => loadGame(lastMeta.slot)}>
            {t('title.continue', { name: lastMeta.name })}
          </button>
        )}
        <button className={`btn block ${lastMeta && !lastMeta.dead ? '' : 'primary'}`} onClick={() => startNew(firstEmpty)}>
          {t('title.newLife')}
        </button>

        <h2 className="section-title">Saves</h2>
        {SLOTS.map((slot) => {
          const m = slotMeta(slot);
          return (
            <div className="card slot" key={slot}>
              <div className="grow">
                <div className="name" style={{ fontWeight: 650 }}>
                  {t('title.slot', { n: slot })}: {m ? m.name : t('title.empty')}
                  {m?.debug && <span className="chip warn" style={{ marginLeft: 6 }}>{t('title.debugged')}</span>}
                </div>
                {m && (
                  <div className="small muted">
                    {m.dead ? t('title.slotDead', { age: Math.floor(m.ageDays / 365) }) : t('title.slotMeta', { age: Math.floor(m.ageDays / 365), day: m.day, cash: `$${Math.round(m.cash)}` })}
                  </div>
                )}
              </div>
              {m ? (
                <>
                  {!m.dead && (
                    <button className="btn small" onClick={() => loadGame(slot)}>
                      {t('title.load')}
                    </button>
                  )}
                  <button className="btn small ghost" onClick={() => setConfirmDelete(slot)} aria-label={`${t('title.delete')} ${t('title.slot', { n: slot })}`}>
                    {t('title.delete')}
                  </button>
                </>
              ) : (
                <button className="btn small" onClick={() => startNew(slot)}>
                  {t('title.new')}
                </button>
              )}
            </div>
          );
        })}
        <button
          className="btn ghost block"
          onClick={async () => {
            const text = await pickFile();
            if (!text) return;
            const err = importSave(text, firstEmpty);
            if (err) toast(t('title.importFailed', { error: err }), 'bad');
          }}
        >
          {t('title.import')}
        </button>
        <p className="small muted" style={{ textAlign: 'center' }}>{t('title.promise')}</p>
        <button className="version-tap" onClick={onVersionTap} aria-label={`Version ${GAME_VERSION}`}>
          {t('title.version', { version: GAME_VERSION })}
        </button>
      </div>
      {confirmDelete !== null && (
        <Sheet label={t('title.delete')} onClose={() => setConfirmDelete(null)}>
          <h2>{t('title.delete')}</h2>
          <p>{t('title.deleteConfirm', { n: confirmDelete })}</p>
          <div className="actions">
            <button className="btn ghost" onClick={() => setConfirmDelete(null)}>
              {t('modal.cancel')}
            </button>
            <button
              className="btn danger"
              onClick={() => {
                deleteSlot(confirmDelete);
                setConfirmDelete(null);
                force((n) => n + 1);
              }}
            >
              {t('title.delete')}
            </button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
