import { useState } from 'react';
import type { Contract, RuleSet } from '../types';
import { TARGET_LABEL } from '../rules';
import { NumberField, TopBar } from './ui';

/**
 * Écran du barème. Les modifications restent un brouillon tant qu'on n'a pas
 * touché « Enregistrer ». Depuis une partie, le barème s'applique à la partie en cours.
 */
export function Settings({ rules, inGame, onSave, onBack }: {
  rules: RuleSet;
  inGame: boolean;
  onSave: (r: RuleSet, keepForNext: boolean) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<RuleSet>(() => structuredClone(rules));
  const [keepForNext, setKeepForNext] = useState(true);
  const dirty = JSON.stringify(draft) !== JSON.stringify(rules);

  const update = (c: Contract) => setDraft({ contracts: draft.contracts.map((x) => (x.id === c.id ? c : x)) });
  const back = () => {
    if (dirty && !confirm('Vous avez des modifications non enregistrées. Quitter sans enregistrer ?')) return;
    onBack();
  };

  return (
    <>
      <TopBar title="Barème des points" onBack={back} />
      <main className="page">
        <p className="hint">
          Les points sont des pénalités : le joueur qui a le moins de points gagne.
          {inGame
            ? ' Les changements s’appliquent à la partie en cours, y compris aux manches déjà jouées.'
            : ' Les changements s’appliquent aux nouvelles parties.'}
        </p>
        {draft.contracts.map((c) => (
          <section className="card" key={c.id}>
            <h2><span className="emoji-sm">{c.emoji}</span>{c.name}</h2>
            <Fields c={c} onChange={update} />
          </section>
        ))}

        <div className="savebar">
          {inGame && (
            <label className="check">
              <input type="checkbox" checked={keepForNext} onChange={(e) => setKeepForNext(e.target.checked)} />
              Garder ce barème pour les prochaines parties
            </label>
          )}
          <button className="btn primary big" disabled={!dirty} onClick={() => onSave(draft, !inGame || keepForNext)}>
            {dirty ? 'Enregistrer le barème' : 'Aucune modification'}
          </button>
        </div>
      </main>
    </>
  );
}

function Fields({ c, onChange }: { c: Contract; onChange: (c: Contract) => void }) {
  if (c.kind === 'perItem') {
    return (
      <div className="fields">
        <label>Points par {TARGET_LABEL[c.target].one}
          <NumberField value={c.pointsPerItem} onChange={(v) => onChange({ ...c, pointsPerItem: v })} />
        </label>
      </div>
    );
  }
  if (c.kind === 'slots') {
    return (
      <div className="fields">
        {c.slots.map((s, k) => (
          <label key={k}>{s.label}
            <NumberField value={s.points}
              onChange={(v) => onChange({ ...c, slots: c.slots.map((x, j) => (j === k ? { ...x, points: v } : x)) })} />
          </label>
        ))}
      </div>
    );
  }
  if (c.kind === 'ranking') {
    return (
      <div className="fields ranks">
        {c.points.map((p, k) => (
          <label key={k}>{k + 1}{k === 0 ? 'er' : 'e'}
            <NumberField value={p} onChange={(v) => onChange({ ...c, points: c.points.map((x, j) => (j === k ? v : x)) })} />
          </label>
        ))}
      </div>
    );
  }
  return (
    <div className="fields">
      <p className="hint first">Toutes les lignes en même temps, avec leurs valeurs.</p>
      <label>Multiplicateur
        <NumberField allowNegative={false} value={c.multiplier} onChange={(v) => onChange({ ...c, multiplier: v })} />
      </label>
    </div>
  );
}