import type { Game } from '../types';
import { ctxOf, isOver, scoreLine, totals } from '../scoring';
import { fmt, places, tone, TopBar } from './ui';

export function Sheet({ game, onBack, onOpenLine, onOpenRules, onFinish }: {
  game: Game; onBack: () => void; onOpenLine: (id: string) => void; onOpenRules: () => void; onFinish: () => void;
}) {
  const ctx = ctxOf(game);
  const t = totals(game);
  const best = Math.min(...t);
  const place = places(t);
  const played = game.rules.contracts.filter((c) => game.results[c.id]).length;
  const over = isOver(game);
  const winners = game.players.filter((_, i) => t[i] === best);

  return (
    <>
      <TopBar title={`Partie · ${game.deck} cartes`} onBack={onBack}
        right={<button className="topbar-link" onClick={onOpenRules}>Barème</button>} />
      <main className="page">
        <section className="card totals">
          {over && <p className="winner">🏆 {winners.join(' et ')} {winners.length > 1 ? 'gagnent' : 'gagne'} !</p>}
          <div className="totals-grid" style={{ gridTemplateColumns: `repeat(${game.players.length}, 1fr)` }}>
            {game.players.map((p, i) => (
              <div key={i} className={played > 0 && t[i] === best ? 'lead' : ''}>
                {played > 0 && <span className="place-badge">{place[i] === 1 ? '1er' : `${place[i]}e`}</span>}
                <span className="who">{p}</span>
                <b className={tone(t[i])}>{fmt(t[i])}</b>
              </div>
            ))}
          </div>
          <p className="hint center">{played} / {game.rules.contracts.length} manches jouées · le moins de points gagne</p>
        </section>

        <section className="card sheet-card">
          <table className="sheet">
            <thead>
              <tr>
                <th />
                {game.players.map((p, i) => <th key={i}><span>{p}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {game.rules.contracts.map((c) => {
                const r = game.results[c.id];
                const s = r ? scoreLine(c, r, game.rules, ctx) : null;
                return (
                  <tr key={c.id} onClick={() => onOpenLine(c.id)} className={r ? 'done' : 'todo'}>
                    <th>
                      <span className="emoji">{c.emoji}</span>
                      <span className="label">{c.name}</span>
                    </th>
                    {s ? s.map((v, i) => <td key={i} className={tone(v)}>{fmt(v)}</td>)
                      : <td colSpan={game.players.length} className="enter">Saisir ›</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <button className={`btn big ${over ? 'primary' : 'ghost'}`}
          onClick={() => (over || confirm('Terminer la partie maintenant ?')) && onFinish()}>
          Terminer la partie
        </button>
      </main>
    </>
  );
}