import type { Game, Round } from '../types';
import { activeContracts, findContract, nextDealer, scoreRound, totalRounds, totals } from '../scoring';
import { fmt, TopBar } from './ui';

export function GameView({ game, onBack, onNewRound, onEditRound, onFinish }: {
  game: Game; onBack: () => void; onNewRound: () => void; onEditRound: (r: Round) => void; onFinish: () => void;
}) {
  const ctx = { deck: game.deck, players: game.players.length };
  const t = totals(game);
  const ranking = game.players.map((name, i) => ({ name, i, score: t[i] })).sort((a, b) => b.score - a.score);
  const contracts = activeContracts(game.rules);
  const dealer = nextDealer(game);
  const done = game.rounds.length;
  const total = totalRounds(game);
  const over = dealer === null;

  return (
    <>
      <TopBar title={`Partie · ${game.deck} cartes`} onBack={onBack} />
      <main className="page">
        <section className="card scoreboard">
          {over && <p className="winner">🏆 {ranking[0].name} gagne !</p>}
          <ol>
            {ranking.map((r, pos) => (
              <li key={r.i} className={pos === 0 && done > 0 ? 'lead' : ''}>
                <span className="place">{pos + 1}</span>
                <span className="name">{r.name}</span>
                <b className={r.score < 0 ? 'neg' : r.score > 0 ? 'pos' : ''}>{fmt(r.score)}</b>
              </li>
            ))}
          </ol>
          <div className="progress"><div style={{ width: `${(done / Math.max(total, 1)) * 100}%` }} /></div>
          <p className="hint center">{done} / {total} donnes · {game.rules.name}</p>
        </section>

        {!over ? (
          <button className="btn primary big" onClick={onNewRound}>
            Saisir une donne <small>· {game.players[dealer]} donne</small>
          </button>
        ) : (
          <button className="btn primary big" onClick={onFinish}>Terminer la partie</button>
        )}

        <section className="card">
          <h2>Contrats joués</h2>
          <div className="grid-wrap">
            <table className="grid">
              <thead>
                <tr><th />{contracts.map((c) => <th key={c.id} title={c.name}>{c.emoji}</th>)}</tr>
              </thead>
              <tbody>
                {game.players.map((p, d) => (
                  <tr key={d} className={d === dealer ? 'current' : ''}>
                    <th>{p}</th>
                    {contracts.map((c) => {
                      const played = game.rounds.some((r) => r.dealer === d && r.contractId === c.id);
                      return <td key={c.id}>{played ? '✓' : ''}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {game.rounds.length > 0 && (
          <section className="card">
            <h2>Historique</h2>
            <ul className="history">
              {[...game.rounds].reverse().map((r, k) => {
                const c = findContract(game.rules, r.contractId);
                const s = scoreRound(r, game.rules, ctx);
                return (
                  <li key={r.id}>
                    <button onClick={() => onEditRound(r)}>
                      <span className="h-title">
                        <span className="num">{game.rounds.length - k}</span>
                        {c?.emoji} {c?.name ?? '?'} <small>· {game.players[r.dealer]}</small>
                      </span>
                      <span className="h-scores">
                        {s.map((v, i) => (
                          <span key={i}><small>{game.players[i]}</small>
                            <b className={v < 0 ? 'neg' : v > 0 ? 'pos' : ''}>{fmt(v)}</b></span>
                        ))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {!over && done > 0 && (
          <button className="btn ghost" onClick={() => confirm('Arrêter la partie maintenant ?') && onFinish()}>
            Arrêter la partie
          </button>
        )}
      </main>
    </>
  );
}
