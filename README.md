# Barbu – compteur de points

Petite web app (React + Vite + TypeScript) pour compter les points du jeu du Barbu.
Installable sur téléphone (PWA), fonctionne hors connexion, données gardées sur l'appareil.

## Fonctionnalités

- 3 à 6 joueurs, jeu de **32 ou 52 cartes** (le nombre de plis et de cœurs s'adapte)
- Chaque joueur donne à tour de rôle et choisit ses contrats ; grille des contrats déjà joués
- Saisie rapide : compteurs +/− pour plis, cœurs, dames ; boutons pour Barbu / derniers plis ; ordre d'arrivée pour la Réussite
- Vérification des totaux (ex. « 12 plis sur 13 »), aperçu des points avant d'enregistrer
- Historique modifiable (toucher une donne pour la corriger ou la supprimer)
- **Règles personnalisables** : valeur de chaque contrat, activer/désactiver, ajouter ses propres contrats
  (par élément, carte précise, classement, combinaison type Salade avec multiplicateur)
- **Partage des règles par lien** : le bouton ⤴ dans l'éditeur génère un lien ; l'ami qui l'ouvre peut les ajouter à ses règles

Règles « Classique » par défaut : Barbu −20, cœur −2, dame −6, pli −2, avant-dernier pli −10, dernier pli −20,
Salade = tout à la fois, Réussite +40 / +20 / +10 / 0.

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
  rules.ts        règles fournies (Classique, Sans salade ni réussite)
  scoring.ts      calcul des points, validation, ordre des donneurs
  scoring.test.ts tests
  storage.ts      localStorage + partage des règles par lien
  components/     écrans (accueil, nouvelle partie, partie, donne, règles)
public/           manifest, service worker, icônes
```

À noter : la partie est stockée sur le téléphone de celui qui compte. Pour un score partagé en direct entre
plusieurs téléphones, il faudrait ajouter une base de données (ex. Supabase ou Vercel KV).
