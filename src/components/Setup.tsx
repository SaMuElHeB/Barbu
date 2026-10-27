import { useState } from 'react';
import type { DeckSize, Game, RuleSet } from '../types';
import { uid } from '../rules';
import { activeContracts } from '../scoring';
import { Segmented, TopBar } from './ui';

export interface LastSetup { players: string[]; deck: DeckSize; ruleId: string }

export function Setup({ ruleSets, last, onBack, onStart }: {
  ruleSets: RuleSet[]; last: LastSetup; onBack: () => void; onStart: (g: Game, s: LastSetup) => void;
}) {
  const [players, setPlayers] = useState<string[]>(last.players);
  const [deck, setDeck] = useState<DeckSize>(last.deck);
  const [ruleId, setRuleId] = useState(ruleSets.some((r) => r.id === last.ruleId) ? last.ruleId : ruleSets[0].id);
  const [firstDealer, setFirstDealer] = useState(0);

  const rules = ruleSets.find((r) => r.id === ruleId)!;
  const names = players.map((p, i) => p.trim() || `Joueur ${i + 1}`);
  const leftover = deck % players.length;
  const nbContracts = activeContracts(rules).length;

  const start = () => {
    const game: Game = {
      id: uid(), createdAt: Date.now(), players: names, deck,
      rules: structuredClone(rules), firstDealer: Math.min(firstDealer, players.length - 1), rounds: [],
    };
    onStart(game, { players, deck, ruleId });
  };

  return (
    <>
      <TopBar title="Nouvelle partie" onBack={onBack} />
      <main className="page">
        <section className="card">
          <h2>Joueurs</h2>
          {players.map((p, i) => (
            <div className="row" key={i}>
              <input value={p} placeholder={`Joueur ${i + 1}`} maxLength={14}
                onChange={(e) => setPlayers(players.map((x, j) => (j === i ? e.target.value : x)))} />
              {players.length > 3 && (
                <button className="icon-btn subtle" aria-label="Retirer"
                  onClick={() => setPlayers(players.filter((_, j) => j !== i))}>×</button>
              )}
            </div>
          ))}
          {players.length < 6 && (
            <button className="btn ghost" onClick={() => setPlayers([...players, ''])}>+ Ajouter un joueur</button>
          )}
        </section>

        <section className="card">
          <h2>Jeu de cartes</h2>
          <Segmented options={[{ value: 32, label: '32 cartes' }, { value: 52, label: '52 cartes' }]}
            value={deck} onChange={setDeck} />
          <p className="hint">
            {Math.floor(deck / players.length)} cartes par joueur · {deck / 4} cœurs
            {leftover > 0 && ` · retirez ${leftover} petite${leftover > 1 ? 's' : ''} carte${leftover > 1 ? 's' : ''} pour que tout le monde en ait autant`}
          </p>
        </section>

        <section className="card">
          <h2>Règles de comptage</h2>
          <select value={ruleId} onChange={(e) => setRuleId(e.target.value)}>
            {ruleSets.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <p className="hint">
            {activeContracts(rules).map((c) => c.emoji).join(' ')} — {nbContracts} contrats × {players.length} donneurs
            = {nbContracts * players.length} donnes
          </p>
        </section>

        <section className="card">
          <h2>Premier donneur</h2>
          <select value={firstDealer} onChange={(e) => setFirstDealer(Number(e.target.value))}>
            {names.map((n, i) => <option key={i} value={i}>{n}</option>)}
          </select>
        </section>

        <button className="btn primary big" onClick={start} disabled={nbContracts === 0}>C'est parti</button>
      </main>
    </>
  );
}
