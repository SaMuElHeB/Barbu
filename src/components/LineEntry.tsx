import { useState } from 'react';
import type { Contract, Game, LineResult, PartInput, SimpleContract } from '../types';
import { TARGET_LABEL } from '../rules';
import { ctxOf, emptyInput, itemTotal, partsOf, scoreLine, validatePart, type Ctx } from '../scoring';
import { fmt, Stepper, TopBar } from './ui';

export function LineEntry({ game, contract, onCancel, onSave, onClear }: {
  game: Game; contract: Contract; onCancel: () => void; onSave: (r: LineResult) => void; onClear?: () => void;
}) {
  const ctx = ctxOf(game);
  const parts = partsOf(contract, game.rules);
  const [inputs, setInputs] = useState<LineResult>(game.results[contract.id] ?? {});
  const get = (p: SimpleContract) => inputs[p.id] ?? emptyInput(p, ctx);
  const result: LineResult = Object.fromEntries(parts.map((p) => [p.id, get(p)]));
  const preview = scoreLine(contract, result, game.rules, ctx);
  const errors = parts.map((p) => validatePart(p, get(p), ctx)).filter((e): e is string => !!e);

  return (
    <>
      <TopBar title={`${contract.emoji} ${contract.name}`} onBack={onCancel} />
      <main className="page">
        {contract.kind === 'composite' && contract.multiplier !== 1 && (
          <p className="hint">Points multipliés par {contract.multiplier}.</p>
        )}
        {parts.map((p) => (
          <section className="card" key={p.id}>
            {parts.length > 1 && <h2><span className="emoji-sm">{p.emoji}</span>{p.name}</h2>}
            <PartForm part={p} value={get(p)} onChange={(v) => setInputs({ ...inputs, [p.id]: v })}
              players={game.players} ctx={ctx} />
          </section>
        ))}

        <section className="card preview">
          <h2>Points de la manche</h2>
          <div className="preview-grid">
            {game.players.map((p, i) => (
              <div key={i}><span>{p}</span>
                <b className={preview[i] < 0 ? 'neg' : preview[i] > 0 ? 'pos' : ''}>{fmt(preview[i])}</b></div>
            ))}
          </div>
        </section>

        {errors.length > 0 && <ul className="errors">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}

        <button className="btn primary big" disabled={errors.length > 0} onClick={() => onSave(result)}>Valider</button>
        {errors.length > 0 && (
          <button className="btn ghost" onClick={() => onSave(result)}>Valider quand même</button>
        )}
        {onClear && <button className="btn danger" onClick={onClear}>Effacer cette manche</button>}
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
    const label = TARGET_LABEL[part.target];
    return (
      <>
        <p className="hint first">
          Combien de {label.many} chacun a pris ? ({fmt(part.pointsPerItem)} par {label.one}) ·{' '}
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
            <p className="hint first">Qui a pris {s.label.toLowerCase()} ? ({fmt(s.points)})</p>
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

  const order = value as number[];
  return (
    <>
      <p className="hint first">Touchez les joueurs dans l'ordre d'arrivée.</p>
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
      {order.length > 0 && <button className="btn ghost small mt" onClick={() => onChange([])}>Recommencer</button>}
    </>
  );
}
