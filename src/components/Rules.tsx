import { useState } from 'react';
import type { Contract, CountTarget, RuleSet } from '../types';
import { KIND_LABEL, newContract, TARGET_LABEL, uid } from '../rules';
import { rulesShareUrl, shareLink } from '../storage';
import { NumberField, TopBar } from './ui';

export function RulesList({ ruleSets, onBack, onOpen, onDuplicate }: {
  ruleSets: RuleSet[]; onBack: () => void; onOpen: (id: string) => void; onDuplicate: (r: RuleSet) => void;
}) {
  return (
    <>
      <TopBar title="Règles du jeu" onBack={onBack} />
      <main className="page">
        <p className="hint">
          Chacun compte à sa façon : dupliquez une règle, ajustez les points, puis partagez-la par lien avec vos amis.
        </p>
        {ruleSets.map((r) => (
          <section className="card rule-item" key={r.id}>
            <button className="rule-open" onClick={() => onOpen(r.id)}>
              <b>{r.name}</b>
              <span className="hint">{r.contracts.filter((c) => c.enabled).map((c) => c.emoji).join(' ')}</span>
            </button>
            <button className="btn ghost small" onClick={() => onDuplicate(r)}>Dupliquer</button>
          </section>
        ))}
      </main>
    </>
  );
}

export function RuleEditor({ rules, onBack, onChange, onDelete, onDuplicate }: {
  rules: RuleSet; onBack: () => void; onChange: (r: RuleSet) => void; onDelete: () => void; onDuplicate: () => void;
}) {
  const [msg, setMsg] = useState('');
  const ro = !!rules.builtIn;
  const update = (c: Contract) => onChange({ ...rules, contracts: rules.contracts.map((x) => (x.id === c.id ? c : x)) });
  const move = (i: number, d: number) => {
    const cs = [...rules.contracts];
    const j = i + d;
    if (j < 0 || j >= cs.length) return;
    [cs[i], cs[j]] = [cs[j], cs[i]];
    onChange({ ...rules, contracts: cs });
  };
  const remove = (id: string) => onChange({
    ...rules,
    contracts: rules.contracts
      .filter((c) => c.id !== id)
      .map((c) => (c.kind === 'composite' ? { ...c, parts: c.parts.filter((p) => p !== id) } : c)),
  });

  const share = async () => {
    const res = await shareLink(rulesShareUrl(rules), `Règles du Barbu : ${rules.name}`);
    setMsg(res === 'copied' ? 'Lien copié !' : res === 'failed' ? 'Partage impossible' : '');
    setTimeout(() => setMsg(''), 2500);
  };

  return (
    <>
      <TopBar title={ro ? rules.name : 'Modifier les règles'} onBack={onBack}
        right={<button className="icon-btn" onClick={share} aria-label="Partager">⤴</button>} />
      <main className="page">
        {msg && <p className="toast">{msg}</p>}
        {ro ? (
          <div className="notice">
            Règle fournie avec l'app.{' '}
            <button className="link" onClick={onDuplicate}>Dupliquer pour la modifier</button>
          </div>
        ) : (
          <section className="card">
            <h2>Nom</h2>
            <input value={rules.name} onChange={(e) => onChange({ ...rules, name: e.target.value })} />
            <p className="hint">Les modifications s'appliquent aux nouvelles parties.</p>
          </section>
        )}

        <fieldset disabled={ro} className="plain">
          {rules.contracts.map((c, i) => (
            <section className={`card contract-edit ${c.enabled ? '' : 'off'}`} key={c.id}>
              <div className="row">
                <input className="emoji-input" value={c.emoji} maxLength={4} aria-label="Emoji"
                  onChange={(e) => update({ ...c, emoji: e.target.value })} />
                <input value={c.name} aria-label="Nom du contrat" onChange={(e) => update({ ...c, name: e.target.value })} />
                <label className="switch" title="Joué dans la partie">
                  <input type="checkbox" checked={c.enabled} onChange={(e) => update({ ...c, enabled: e.target.checked })} />
                  <span />
                </label>
              </div>
              <ContractFields c={c} all={rules.contracts} onChange={update} />
              {!ro && (
                <div className="row tools">
                  <button className="btn ghost small" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button className="btn ghost small" onClick={() => move(i, 1)} disabled={i === rules.contracts.length - 1}>↓</button>
                  <span className="grow" />
                  <button className="btn ghost small danger-text"
                    onClick={() => confirm(`Supprimer « ${c.name} » ?`) && remove(c.id)}>Supprimer</button>
                </div>
              )}
            </section>
          ))}
        </fieldset>

        {!ro && (
          <>
            <section className="card">
              <h2>Ajouter un contrat</h2>
              {(Object.keys(KIND_LABEL) as Contract['kind'][]).map((k) => (
                <button key={k} className="btn ghost left"
                  onClick={() => onChange({ ...rules, contracts: [...rules.contracts, newContract(k)] })}>
                  + {KIND_LABEL[k]}
                </button>
              ))}
            </section>
            <button className="btn danger" onClick={() => confirm('Supprimer ces règles ?') && onDelete()}>
              Supprimer ces règles
            </button>
          </>
        )}
      </main>
    </>
  );
}

function ContractFields({ c, all, onChange }: { c: Contract; all: Contract[]; onChange: (c: Contract) => void }) {
  if (c.kind === 'perItem') {
    return (
      <div className="fields">
        <label>Points par
          <select value={c.target} onChange={(e) => onChange({ ...c, target: e.target.value as CountTarget })}>
            {(Object.keys(TARGET_LABEL) as CountTarget[]).map((t) => (
              <option key={t} value={t}>{TARGET_LABEL[t].replace(/s$/, '')}</option>
            ))}
          </select>
        </label>
        <label>Valeur <NumberField value={c.pointsPerItem} onChange={(v) => onChange({ ...c, pointsPerItem: v })} /></label>
        {c.target === 'custom' && (
          <label>Nombre total <NumberField allowNegative={false} value={c.customTotal ?? 0}
            onChange={(v) => onChange({ ...c, customTotal: v })} /></label>
        )}
      </div>
    );
  }
  if (c.kind === 'slots') {
    return (
      <div className="fields">
        {c.slots.map((s, k) => (
          <div className="row" key={k}>
            <input value={s.label} aria-label="Carte ou pli"
              onChange={(e) => onChange({ ...c, slots: c.slots.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)) })} />
            <NumberField value={s.points}
              onChange={(v) => onChange({ ...c, slots: c.slots.map((x, j) => (j === k ? { ...x, points: v } : x)) })} />
            {c.slots.length > 1 && (
              <button className="icon-btn subtle" aria-label="Retirer"
                onClick={() => onChange({ ...c, slots: c.slots.filter((_, j) => j !== k) })}>×</button>
            )}
          </div>
        ))}
        <button className="btn ghost small" onClick={() => onChange({ ...c, slots: [...c.slots, { label: 'Autre', points: -10 }] })}>
          + Ajouter une carte / un pli
        </button>
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
  const simple = all.filter((x) => x.kind !== 'composite');
  return (
    <div className="fields">
      <p className="hint">Contrats joués ensemble :</p>
      <div className="chips">
        {simple.map((x) => {
          const on = c.parts.includes(x.id);
          return (
            <button key={x.id} type="button" className={`chip ${on ? 'on' : ''}`}
              onClick={() => onChange({ ...c, parts: on ? c.parts.filter((p) => p !== x.id) : [...c.parts, x.id] })}>
              {x.emoji} {x.name}
            </button>
          );
        })}
      </div>
      <label>Multiplicateur <NumberField allowNegative={false} value={c.multiplier}
        onChange={(v) => onChange({ ...c, multiplier: v })} /></label>
    </div>
  );
}

export function duplicateRules(r: RuleSet): RuleSet {
  return { ...structuredClone(r), id: uid(), name: `${r.name} (perso)`, builtIn: false };
}
