import { useState } from 'react';
import { BACKSTORIES } from '../../content/backstories';
import { hashSeed } from '../../engine/rng';
import type { AvatarSpec, BackstoryId, Pronouns } from '../../engine/types';
import { t } from '../../i18n';
import { ACCESSORIES, Avatar, FACIAL, HAIR_COLORS, HAIR_STYLES, SKIN_TONES, TOP_COLORS } from '../art/Avatar';
import { setState, startNewGame, toast } from '../store';

const rand = (n: number) => Math.floor(Math.random() * n);
const randomAvatar = (): AvatarSpec => ({
  skin: rand(SKIN_TONES.length),
  hair: rand(HAIR_STYLES.length),
  hairColor: rand(HAIR_COLORS.length),
  facial: rand(FACIAL.length),
  top: rand(TOP_COLORS.length),
  accessory: rand(ACCESSORIES.length),
});

export function CreateScreen() {
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState<Pronouns>('they');
  const [avatar, setAvatar] = useState<AvatarSpec>(randomAvatar);
  const [backstory, setBackstory] = useState<BackstoryId>('laid_off');
  const [seed, setSeed] = useState('');
  const set = (k: keyof AvatarSpec, v: number) => setAvatar((a) => ({ ...a, [k]: v }));

  const begin = () => {
    if (!name.trim()) return toast(t('create.nameRequired'), 'bad');
    const s = seed.trim() ? (/^\d+$/.test(seed.trim()) ? Number(seed.trim()) : hashSeed(seed.trim())) : hashSeed(`${name}-${Date.now()}-${Math.random()}`);
    startNewGame({ name: name.trim(), pronouns, avatar, backstory, seed: s });
  };

  const Swatches = ({ k, colors }: { k: keyof AvatarSpec; colors: string[] }) => (
    <div className="swatches" role="group">
      {colors.map((c, i) => (
        <button key={c} className="swatch" style={{ background: c }} aria-pressed={avatar[k] === i} aria-label={`${k} ${i + 1}`} onClick={() => set(k, i)} />
      ))}
    </div>
  );
  const Seg = ({ k, labels }: { k: keyof AvatarSpec; labels: string[] }) => (
    <div className="seg" role="group">
      {labels.map((l, i) => (
        <button key={l} aria-pressed={avatar[k] === i} onClick={() => set(k, i)}>
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <main className="main" style={{ paddingBottom: 40 }}>
      <div className="row spread" style={{ margin: '8px 0 12px' }}>
        <h1 style={{ fontSize: 28 }}>{t('create.title')}</h1>
        <button className="btn small ghost" onClick={() => setState({ screen: 'title' })}>
          {t('create.back')}
        </button>
      </div>
      <div className="stack">
        <div className="card stack">
          <div className="avatar-preview">
            <Avatar spec={avatar} size={120} title={name || 'Your character'} />
          </div>
          <label className="field">
            <span className="label">{t('create.name')}</span>
            <input className="input" value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder={t('create.namePlaceholder')} autoFocus />
          </label>
          <div className="field">
            <span className="label">{t('create.pronouns')}</span>
            <div className="seg" role="group" aria-label={t('create.pronouns')}>
              {(['they', 'she', 'he'] as const).map((p) => (
                <button key={p} aria-pressed={pronouns === p} onClick={() => setPronouns(p)}>
                  {p === 'they' ? 'they/them' : p === 'she' ? 'she/her' : 'he/him'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card stack">
          <div className="row spread">
            <h2 style={{ fontSize: 18 }}>{t('create.look')}</h2>
            <button className="btn small ghost" onClick={() => setAvatar(randomAvatar())}>
              {t('create.randomize')}
            </button>
          </div>
          <div className="field">
            <span className="label">{t('create.skin')}</span>
            <Swatches k="skin" colors={SKIN_TONES} />
          </div>
          <div className="field">
            <span className="label">{t('create.hair')}</span>
            <Seg k="hair" labels={HAIR_STYLES} />
          </div>
          <div className="field">
            <span className="label">{t('create.hairColor')}</span>
            <Swatches k="hairColor" colors={HAIR_COLORS} />
          </div>
          <div className="field">
            <span className="label">{t('create.facial')}</span>
            <Seg k="facial" labels={FACIAL} />
          </div>
          <div className="field">
            <span className="label">{t('create.top')}</span>
            <Swatches k="top" colors={TOP_COLORS} />
          </div>
          <div className="field">
            <span className="label">{t('create.accessory')}</span>
            <Seg k="accessory" labels={ACCESSORIES} />
          </div>
        </div>

        <h2 className="section-title">{t('create.backstory')}</h2>
        <div className="stack" role="radiogroup" aria-label={t('create.backstory')}>
          {BACKSTORIES.map((b) => (
            <button key={b.id} className="card backstory" role="radio" aria-checked={backstory === b.id} aria-pressed={backstory === b.id} onClick={() => setBackstory(b.id)}>
              <div className="card-title">{b.title}</div>
              <p className="card-desc" style={{ fontFamily: 'var(--serif)', fontSize: 15 }}>{b.pitch}</p>
              <ul>
                {b.modifiers.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <details className="card">
          <summary className="small muted">{t('create.seed')}</summary>
          <input className="input" style={{ marginTop: 8 }} value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="e.g. 12345 or any word" />
        </details>

        <button className="btn primary block" style={{ minHeight: 54, fontSize: 18 }} onClick={begin}>
          {t('create.start')}
        </button>
      </div>
    </main>
  );
}
