import { useState } from 'react';
import type { DeckSize } from '../types';
import { Segmented, TopBar } from './ui';

export interface SetupResult { players: string[]; deck: DeckSize }

export function Setup({ known, setKnown, last, onBack, onStart }: {
  known: string[];
  setKnown: (k: string[]) => void;
  last: SetupResult;
  onBack: () => void;
  onStart: (s: SetupResult) => void;
}) {
  const [players, setPlayers] = useState<string[]>(last.players.filter((p) => known.includes(p)));
  const [deck, setDeck] = useState<DeckSize>(last.deck);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);

  const full = players.length >= 6;
  const others = known.filter((k) => !players.includes(k));

  const addNew = () => {
    const name = draft.trim().slice(0, 14);
    if (!name || full) return;
    const existing = known.find((k) => k.toLowerCase() === name.toLowerCase());
    const final = existing ?? name;
    if (!existing) setKnown([...known, final]);
    if (!players.includes(final)) setPlayers([...players, final]);
    setDraft('');
  };

  return (
    <>
      <TopBar title="Nouvelle partie" onBack={onBack} />
      <main className="page">
        <section className="card">
          <h2>Joueurs de la partie <span className="count">{players.length}/6</span></h2>
          {players.length === 0 && <p className="hint first">Ajoutez de 3 à 6 joueurs, dans l'ordre autour de la table.</p>}
          <ol className="seated">
            {players.map((p, i) => (
              <li key={p}>
                <span className="seat">{i + 1}</span>
                <span className="grow">{p}</span>
                <button className="icon-btn subtle" aria-label={`Retirer ${p}`}
                  onClick={() => setPlayers(players.filter((x) => x !== p))}>×</button>
              </li>
            ))}
          </ol>
          <form className="row add" onSubmit={(e) => { e.preventDefault(); addNew(); }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nouveau joueur"
              maxLength={14} disabled={full} />
            <button className="btn primary" type="submit" disabled={!draft.trim() || full}>Ajouter</button>
          </form>
        </section>

        {others.length > 0 && (
          <section className="card">
            <h2>
              Joueurs enregistrés
              <button className="link small" onClick={() => setEditing(!editing)}>{editing ? 'Terminé' : 'Modifier'}</button>
            </h2>
            <div className="chips">
              {others.map((k) => (
                editing ? (
                  <button key={k} className="chip remove" onClick={() => setKnown(known.filter((x) => x !== k))}>
                    {k} <span aria-label="Oublier">×</span>
                  </button>
                ) : (
                  <button key={k} className="chip" disabled={full} onClick={() => setPlayers([...players, k])}>+ {k}</button>
                )
              ))}
            </div>
            <p className="hint">{editing ? 'Touchez un nom pour l’oublier.' : 'Touchez un nom pour l’ajouter à la partie.'}</p>
          </section>
        )}

        <section className="card">
          <h2>Jeu de cartes</h2>
          <Segmented options={[{ value: 32, label: '32 cartes' }, { value: 52, label: '52 cartes' }]}
            value={deck} onChange={setDeck} />
          {players.length >= 3 && (
            <p className="hint">
              {Math.floor(deck / players.length)} cartes par joueur
              {deck % players.length > 0 && ` · retirez ${deck % players.length} petite(s) carte(s) pour que tout le monde en ait autant`}
            </p>
          )}
        </section>

        <button className="btn primary big" disabled={players.length < 3}
          onClick={() => onStart({ players, deck })}>
          {players.length < 3 ? `Encore ${3 - players.length} joueur(s)` : 'Commencer la partie'}
        </button>
      </main>
    </>
  );
}
