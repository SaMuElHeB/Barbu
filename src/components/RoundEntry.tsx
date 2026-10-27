import { useMemo, useState } from 'react';
import type { Game, PartInput, Round, SimpleContract } from '../types';
import { TARGET_LABEL, uid } from '../rules';
import {
  activeContracts, emptyInput, findContract, itemTotal, nextDealer, partsOf, remainingFor, scoreRound, validatePart,
  type Ctx,
} from '../scoring';
import { fmt, Stepper, TopBar } from './ui';

export function RoundEntry({ game, editing, onCancel, onSave, onDelete }: {
  game: Game; editing?: Round; onCancel: () => void; onSave: (r: Round) => void; onDelete?: () => void;
}) {
  const ctx: Ctx = { deck: game.deck, players: game.players.length };
  const others = { ...game, rounds: game.rounds.filter((r) => r.id !== editing?.id) };

  const [dealer, setDealer] = useState(editing?.dealer ?? nextDealer(game) ?? 0);
  const available = editing ? activeContracts(game.rules) : remainingFor(others, dealer);
  const [contractId, setContractId] = useState(editing?.contractId ?? available[0]?.id ?? '');
  const [inputs, setInputs] = useState<Record<string, PartInput>>(editing?.inputs ?? {});

  const contract = findContract(game.rules, contractId);
  const parts = contract ? partsOf(contract, game.rules) : [];
  const get = (p: SimpleContract) => inputs[p.id] ?? emptyInput(p, ctx);
  const set = (p: SimpleContract, v: PartInput) => setInputs({ ...inputs, [p.id]: v });

  const round: Round = { id: editing?.id ?? uid(), dealer, contractId, inputs: Object.fromEntries(parts.map((p) => [p.id, get(p)])) };
  const preview = useMemo(() => scoreRound(round, game.rules, ctx), [JSON.stringify(round)]); // eslint-disable-line react-hooks/exhaustive-deps
  const errors = parts.map((p) => validatePart(p, get(p), ctx)).filter((e): e is string => !!e);

  const changeDealer = (d: number) => {
    setDealer(d);
    if (!editing) {
      const avail = remainingFor(others, d);
      if (!avail.some((c) => c.id === contractId)) setContractId(avail[0]?.id ?? '');
    }
  };

  return (
    <>
      <TopBar title={editing ? 'Modifier la donne' : 'Nouvelle donne'} onBack={onCancel} />
      <main className="page">
        <section className="card">
          <h2>Donneur</h2>
          <div className="chips">
            {game.players.map((p, i) => {
              const left = remainingFor(others, i).length;
              return (
                <button key={i} className={`chip ${dealer === i ? 'on' : ''}`} onClick={() => changeDealer(i)}
                  disabled={!editing && left === 0}>
                  {p}{!editing && <small> · {left}</small>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card">
          <h2>Contrat</h2>
          {available.length === 0 ? <p className="hint">Ce joueur a joué tous ses contrats.</p> : (
            <div className="contract-grid">
              {available.map((c) => (
                <button key={c.id} className={`contract ${c.id === contractId ? 'on' : ''}`}
                  onClick={() => setContractId(c.id)}>
                  <span className="emoji">{c.emoji}</span>{c.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {parts.map((p) => (
          <section className="card" key={p.id}>
            <h2>{parts.length > 1 && <span className="emoji-sm">{p.emoji}</span>}{p.name}</h2>
            <PartForm part={p} value={get(p)} onChange={(v) => set(p, v)} players={game.players} ctx={ctx} />
          </section>
        ))}

        {contract && (
          <section className="card preview">
            <h2>Points de la donne</h2>
            <div className="preview-grid">
              {game.players.map((p, i) => (
                <div key={i}><span>{p}</span><b className={preview[i] < 0 ? 'neg' : preview[i] > 0 ? 'pos' : ''}>{fmt(preview[i])}</b></div>
              ))}
            </div>
          </section>
        )}

        {errors.length > 0 && <ul className="errors">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}

        <button className="btn primary big" disabled={!contract || errors.length > 0} onClick={() => onSave(round)}>
          Enregistrer
        </button>
        {contract && errors.length > 0 && (
          <button className="btn ghost" onClick={() => onSave(round)}>Enregistrer quand même</button>
        )}
        {onDelete && <button className="btn danger" onClick={onDelete}>Supprimer cette donne</button>}
      </main>
    </>
  );
}

function PartForm({ part, value, onChange, players, ctx }: {
  part: SimpleContract; value: PartInput; onChange: (v: PartInput) => void; players: string[]; ctx: Ctx;
}) {
  if (part.kind === 'perItem') {
    const total = itemTotal(part, ctx);
    const sum = value.reduce<number>((a, b) => a + (b ?? 0), 0);
    return (
      <>
        <p className="hint">
          {fmt(part.pointsPerItem)} par {TARGET_LABEL[part.target].replace(/s$/, '')} ·{' '}
          <b className={sum === total ? 'ok' : ''}>{sum} / {total}</b>
        </p>
        {players.map((p, i) => (
          <div className="row between" key={i}>
            <span>{p}</span>
            <Stepper value={value[i] ?? 0} max={total}
              onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
          </div>
        ))}
      </>
    );
  }

  if (part.kind === 'slots') {
    return (
      <>
        {part.slots.map((s, k) => (
          <div key={k} className="slot">
            <p className="hint">{s.label} ({fmt(s.points)}) — qui l'a pris ?</p>
            <div className="chips">
              {players.map((p, i) => (
                <button key={i} className={`chip ${value[k] === i ? 'on' : ''}`}
                  onClick={() => onChange(value.map((x, j) => (j === k ? i : x)))}>{p}</button>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  }

  // Classement : on touche les joueurs dans l'ordre d'arrivée.
  const order = value as number[];
  return (
    <>
      <p className="hint">Touchez les joueurs dans l'ordre d'arrivée.</p>
      <div className="chips">
        {players.map((p, i) => {
          const rank = order.indexOf(i);
          return (
            <button key={i} className={`chip ${rank >= 0 ? 'on' : ''}`}
              onClick={() => onChange(rank >= 0 ? order.filter((x) => x !== i) : [...order, i])}>
              {rank >= 0 && <b className="rank">{rank + 1}</b>}{p}
              {rank >= 0 && <small> {fmt(part.points[rank] ?? 0)}</small>}
            </button>
          );
        })}
      </div>
      {order.length > 0 && <button className="btn ghost small" onClick={() => onChange([])}>Recommencer</button>}
    </>
  );
}
