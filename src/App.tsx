import { useState } from 'react';
import type { Game, RuleSet } from './types';
import { DEFAULT_RULES, uid } from './rules';
import { findContract, isOver, totals } from './scoring';
import { readSharedRules, useStored } from './storage';
import { Setup, type SetupResult } from './components/Setup';
import { Sheet } from './components/Sheet';
import { LineEntry } from './components/LineEntry';
import { Settings } from './components/Settings';
import { fmt } from './components/ui';

type Screen =
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'sheet' }
  | { name: 'line'; id: string }
  | { name: 'settings' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [game, setGame] = useStored<Game | null>('barbu2.game', null);
  const [archive, setArchive] = useStored<Game[]>('barbu2.archive', []);
  const [rules, setRules] = useStored<RuleSet>('barbu2.rules', DEFAULT_RULES);
  const [known, setKnown] = useStored<string[]>('barbu2.players', []);
  const [last, setLast] = useStored<SetupResult>('barbu2.last', { players: [], deck: 32 });
  const [shared, setShared] = useState<RuleSet | null>(() => readSharedRules());

  const go = (s: Screen) => { setScreen(s); window.scrollTo(0, 0); };
  const clearHash = () => history.replaceState(null, '', location.pathname);

  const archiveCurrent = () => {
    if (game && Object.keys(game.results).length) setArchive((a) => [game, ...a].slice(0, 30));
  };

  if (screen.name === 'setup') {
    return <Setup known={known} setKnown={setKnown} last={last} onBack={() => go({ name: 'home' })}
      onStart={(s) => {
        archiveCurrent();
        setLast(s);
        setGame({ id: uid(), createdAt: Date.now(), players: s.players, deck: s.deck,
          rules: structuredClone(rules), results: {} });
        go({ name: 'sheet' });
      }} />;
  }

  if (screen.name === 'sheet' && game) {
    return <Sheet game={game} onBack={() => go({ name: 'home' })} onOpenLine={(id) => go({ name: 'line', id })}
      onFinish={() => { archiveCurrent(); setGame(null); go({ name: 'home' }); }} />;
  }

  if (screen.name === 'line' && game) {
    const contract = findContract(game.rules, screen.id);
    if (contract) {
      const { [contract.id]: _, ...rest } = game.results;
      return <LineEntry key={contract.id} game={game} contract={contract} onCancel={() => go({ name: 'sheet' })}
        onSave={(r) => { setGame({ ...game, results: { ...game.results, [contract.id]: r } }); go({ name: 'sheet' }); }}
        onClear={game.results[contract.id] ? () => {
          if (!confirm('Effacer les points de cette manche ?')) return;
          setGame({ ...game, results: rest });
          go({ name: 'sheet' });
        } : undefined} />;
    }
  }

  if (screen.name === 'settings') {
    return <Settings rules={rules} onChange={setRules} onBack={() => go({ name: 'home' })} />;
  }

  // ---- Accueil ----
  const t = game ? totals(game) : [];
  const played = game ? Object.keys(game.results).length : 0;
  return (
    <main className="page home">
      <div className="hero">
        <div className="logo" aria-hidden>🧔</div>
        <h1>Barbu</h1>
        <p>Le compteur de points</p>
      </div>

      {shared && (
        <section className="card notice">
          <p>On vous a partagé un barème de points. L'utiliser à la place du vôtre ?</p>
          <div className="row">
            <button className="btn primary" onClick={() => {
              setRules(shared); setShared(null); clearHash(); go({ name: 'settings' });
            }}>Utiliser ce barème</button>
            <button className="btn ghost" onClick={() => { setShared(null); clearHash(); }}>Ignorer</button>
          </div>
        </section>
      )}

      {game && (
        <button className="card current-game" onClick={() => go({ name: 'sheet' })}>
          <span className="label">
            Partie en cours · {isOver(game) ? 'terminée' : `${played}/${game.rules.contracts.length} manches`}
          </span>
          <span className="players">
            {game.players.map((p, i) => <span key={i}>{p} <b>{fmt(t[i])}</b></span>)}
          </span>
          <span className="cta">Reprendre ›</span>
        </button>
      )}

      <button className="btn primary big" onClick={() => {
        if (game && !confirm('Une partie est en cours. En commencer une nouvelle ? (l’actuelle sera archivée)')) return;
        go({ name: 'setup' });
      }}>Nouvelle partie</button>
      <button className="btn ghost big" onClick={() => go({ name: 'settings' })}>Barème des points</button>

      {archive.length > 0 && (
        <section className="card">
          <h2>Dernières parties</h2>
          <ul className="archive">
            {archive.map((g) => {
              const tt = totals(g);
              const best = tt.indexOf(Math.max(...tt));
              return (
                <li key={g.id}>
                  <span>{new Date(g.createdAt).toLocaleDateString('fr-FR')} · {g.players.length} joueurs</span>
                  <span>🏆 {g.players[best]} <b>{fmt(tt[best])}</b></span>
                </li>
              );
            })}
          </ul>
          <button className="btn ghost small" onClick={() => confirm('Effacer l’historique ?') && setArchive([])}>Effacer</button>
        </section>
      )}
    </main>
  );
}
