import { useState } from 'react';
import type { Game, Round, RuleSet } from './types';
import { BUILT_IN_RULES, uid } from './rules';
import { totalRounds, totals } from './scoring';
import { readSharedRules, useStored } from './storage';
import { Setup, type LastSetup } from './components/Setup';
import { GameView } from './components/GameView';
import { RoundEntry } from './components/RoundEntry';
import { duplicateRules, RuleEditor, RulesList } from './components/Rules';
import { fmt } from './components/ui';

type Screen =
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'game' }
  | { name: 'round'; editing?: Round }
  | { name: 'rules' }
  | { name: 'rule'; id: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [game, setGame] = useStored<Game | null>('barbu.game', null);
  const [archive, setArchive] = useStored<Game[]>('barbu.archive', []);
  const [custom, setCustom] = useStored<RuleSet[]>('barbu.rules', []);
  const [last, setLast] = useStored<LastSetup>('barbu.last', {
    players: ['', '', '', ''], deck: 32, ruleId: 'classique',
  });
  const [shared, setShared] = useState<RuleSet | null>(() => readSharedRules());

  const ruleSets = [...BUILT_IN_RULES, ...custom];
  const go = (s: Screen) => { setScreen(s); window.scrollTo(0, 0); };

  const saveRules = (r: RuleSet) => setCustom((cs) => (cs.some((c) => c.id === r.id) ? cs.map((c) => (c.id === r.id ? r : c)) : [...cs, r]));
  const duplicate = (r: RuleSet) => { const d = duplicateRules(r); saveRules(d); go({ name: 'rule', id: d.id }); };

  const importShared = () => {
    if (!shared) return;
    const r = { ...shared, id: uid(), builtIn: false };
    saveRules(r);
    setShared(null);
    history.replaceState(null, '', location.pathname);
    go({ name: 'rule', id: r.id });
  };
  const dismissShared = () => { setShared(null); history.replaceState(null, '', location.pathname); };

  const finish = () => {
    if (game && game.rounds.length) setArchive((a) => [game, ...a].slice(0, 20));
    setGame(null);
    go({ name: 'home' });
  };

  const saveRound = (r: Round) => {
    if (!game) return;
    const exists = game.rounds.some((x) => x.id === r.id);
    setGame({ ...game, rounds: exists ? game.rounds.map((x) => (x.id === r.id ? r : x)) : [...game.rounds, r] });
    go({ name: 'game' });
  };

  if (screen.name === 'setup') {
    return <Setup ruleSets={ruleSets} last={last} onBack={() => go({ name: 'home' })}
      onStart={(g, s) => {
        if (game && game.rounds.length) setArchive((a) => [game, ...a].slice(0, 20));
        setGame(g); setLast(s); go({ name: 'game' });
      }} />;
  }

  if (screen.name === 'game' && game) {
    return <GameView game={game} onBack={() => go({ name: 'home' })} onNewRound={() => go({ name: 'round' })}
      onEditRound={(r) => go({ name: 'round', editing: r })} onFinish={finish} />;
  }

  if (screen.name === 'round' && game) {
    const editing = screen.editing;
    return <RoundEntry game={game} editing={editing} onCancel={() => go({ name: 'game' })} onSave={saveRound}
      onDelete={editing ? () => {
        if (!confirm('Supprimer cette donne ?')) return;
        setGame({ ...game, rounds: game.rounds.filter((x) => x.id !== editing.id) });
        go({ name: 'game' });
      } : undefined} />;
  }

  if (screen.name === 'rules') {
    return <RulesList ruleSets={ruleSets} onBack={() => go({ name: 'home' })}
      onOpen={(id) => go({ name: 'rule', id })} onDuplicate={duplicate} />;
  }

  if (screen.name === 'rule') {
    const r = ruleSets.find((x) => x.id === screen.id);
    if (r) {
      return <RuleEditor rules={r} onBack={() => go({ name: 'rules' })} onChange={saveRules}
        onDuplicate={() => duplicate(r)}
        onDelete={() => { setCustom((cs) => cs.filter((c) => c.id !== r.id)); go({ name: 'rules' }); }} />;
    }
  }

  // ---- Accueil ----
  const t = game ? totals(game) : [];
  return (
    <main className="page home">
      <div className="hero">
        <div className="logo" aria-hidden>🧔</div>
        <h1>Barbu</h1>
        <p>Le compteur de points</p>
      </div>

      {shared && (
        <section className="card notice">
          <p>On vous a partagé les règles <b>« {shared.name} »</b>.</p>
          <div className="row">
            <button className="btn primary" onClick={importShared}>Ajouter à mes règles</button>
            <button className="btn ghost" onClick={dismissShared}>Ignorer</button>
          </div>
        </section>
      )}

      {game && (
        <button className="card current-game" onClick={() => go({ name: 'game' })}>
          <span className="label">Partie en cours · {game.rounds.length}/{totalRounds(game)} donnes</span>
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
      <button className="btn ghost big" onClick={() => go({ name: 'rules' })}>Règles de comptage</button>

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
