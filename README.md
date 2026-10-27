# Barbu – compteur de points

Petite web app (React + Vite + TypeScript) pour compter les points du jeu du Barbu.
Installable sur téléphone (PWA), fonctionne hors connexion, données gardées sur l'appareil.

## Fonctionnalités

- **Joueurs mémorisés** : les noms saisis une fois sont proposés aux parties suivantes (3 à 6 joueurs)
- Jeu de **32 ou 52 cartes** (le nombre de plis et de cœurs à répartir s'adapte)
- **Feuille de score** : le total de chaque joueur en haut, puis une ligne par manche :
  pas de plis, pas de cœurs, pas de dames, pas le roi de cœur, pas les 2 derniers plis, salade, réussite
- On touche une ligne et on indique ce que chacun a ramassé ; l'app calcule les points et vérifie les totaux
- **Barème modifiable** (valeur de chaque ligne, points de la réussite, multiplicateur de la salade)
  et **partageable par lien** avec ses amis

Barème par défaut : pli −2, cœur −2, dame −6, roi de cœur −20, avant-dernier pli −10, dernier pli −20,
salade = tout à la fois, réussite +40 / +20 / +10 / 0.

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests du calcul des scores
npm run build
```

## Déployer sur Vercel

1. Créer un dépôt GitHub et pousser ce dossier.
2. Sur vercel.com → *Add New Project* → importer le dépôt. Vercel détecte Vite automatiquement
   (build `npm run build`, dossier `dist`). Rien d'autre à configurer.

## Installer sur le téléphone

- **iPhone (Safari)** : ouvrir le lien → bouton Partager → *Sur l'écran d'accueil*.
- **Android (Chrome)** : ouvrir le lien → menu ⋮ → *Installer l'application*.

## Structure

```
src/
  types.ts        modèle de données (contrats, règles, partie)
  rules.ts        barème par défaut
  scoring.ts      calcul des points et validation
  scoring.test.ts tests
  storage.ts      localStorage + partage du barème par lien
  components/     écrans (accueil, nouvelle partie, feuille de score, saisie, barème)
public/           manifest, service worker, icônes
```

À noter : la partie est stockée sur le téléphone de celui qui compte. Pour un score partagé en direct entre
plusieurs téléphones, il faudrait ajouter une base de données (ex. Supabase ou Vercel KV).
