import { useState } from 'react';
import type { Contract, RuleSet } from '../types';
import { DEFAULT_RULES, TARGET_LABEL } from '../rules';
import { rulesShareUrl, shareLink } from '../storage';
import { NumberField, TopBar } from './ui';

export function Settings({ rules, onChange, onBack }: {
  rules: RuleSet; onChange: (r: RuleSet) => void; onBack: () => void;
}) {
  const [msg, setMsg] = useState('');
  const update = (c: Contract) => onChange({ contracts: rules.contracts.map((x) => (x.id === c.id ? c : x)) });

  const share = async () => {
    const res = await shareLink(rulesShareUrl(rules), 'Mon barème du Barbu');
    if (res !== 'shared') {
      setMsg(res === 'copied' ? 'Lien copié, envoyez-le à vos amis !' : 'Partage impossible');
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <>
      <TopBar title="Barème des points" onBack={onBack} />
      <main className="page">
        <p className="hint">Chacun compte à sa façon : ajustez les valeurs. Elles s'appliquent aux nouvelles parties.</p>
        {rules.contracts.map((c) => (
          <section className="card" key={c.id}>
            <h2><span className="emoji-sm">{c.emoji}</span>{c.name}</h2>
            <Fields c={c} onChange={update} />
          </section>
        ))}
        {msg && <p className="toast">{msg}</p>}
        <button className="btn primary big" onClick={share}>Partager mon barème</button>
        <button className="btn ghost" onClick={() => confirm('Revenir au barème par défaut ?') && onChange(DEFAULT_RULES)}>
          Revenir au barème par défaut
        </button>
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
