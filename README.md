# Codex

Application de chat IA propulsée par **Claude** (Anthropic) avec :
- 3 modèles sélectionnables : **Opus 4.7** (par défaut), **Sonnet 4.6**, **Haiku 4.5**
- Streaming des réponses (Server-Sent Events) pour un affichage temps réel
- Adaptive thinking + effort ajusté par modèle (Opus = `xhigh`, Sonnet = `medium`)
- Prompt caching automatique du system prompt (lecture ~10× moins chère)
- Pièces jointes : texte, code, **images**, **PDF**, et **archives `.zip`**
  (extraction côté serveur — limite 10 Mo / fichier, 25 Mo / requête)
- Une vidéo d'intro (4 secondes en plein écran) puis cette vidéo en fond,
  avec **slider d'opacité** (0–100 %) et choix Vidéo / Noir / Blanc
- Interface style ChatGPT (bulles `rounded-3xl`, input pill, boutons arrondis)
- Thème sombre par défaut + 9 couleurs d'accent (orange, bleu, jaune, rose,
  violet, rouge, vert, gris, blanc), persistées en `localStorage`
- Sidebar gauche avec accès aux **Paramètres** (apparence, fond, dictée vocale)
- Bouton **+** pour joindre des fichiers, bouton **micro** pour dicter
  (Web Speech API)
- Barre meta au-dessus de l'input : nom de la branche Git à gauche,
  compteurs `+lignes`/`−lignes` à droite (vert/rouge subtil)
- Authentification GitHub via Supabase Auth (optionnelle)

## Démarrage

```bash
pnpm install
cp .env.local.example .env.local
# Remplissez ANTHROPIC_API_KEY (et éventuellement les clés Supabase)
pnpm dev
```

Ouvrez http://localhost:3000.

## Connexion à Claude (Anthropic)

L'IA passe par l'API Anthropic. Récupérez une clé sur
https://console.anthropic.com → **API Keys**, puis ajoutez-la
dans `.env.local` :

```
ANTHROPIC_API_KEY=sk-ant-...
```

Sur Vercel : **Project Settings → Environment Variables**.

> Sans clé, l'application démarre quand même : un badge « IA non configurée »
> s'affiche à côté du titre et l'envoi renvoie une erreur 500 explicite.

### Modèles disponibles

| Modèle      | ID                  | Usage                                |
| ----------- | ------------------- | ------------------------------------ |
| Opus 4.7    | `claude-opus-4-7`   | Le plus capable — code et agentique  |
| Sonnet 4.6  | `claude-sonnet-4-6` | Équilibre vitesse / intelligence     |
| Haiku 4.5   | `claude-haiku-4-5`  | Le plus rapide et économique         |

Le sélecteur de modèle est dans le header (à côté du bouton de connexion).
Le choix est persisté en `localStorage`.

### Paramètres par modèle (gérés automatiquement)

- **Opus 4.7** : `thinking: adaptive` + `output_config.effort: "xhigh"`.
  Pas de `temperature`/`top_p`/`budget_tokens` (renvoient 400 sur 4.7).
- **Sonnet 4.6** : `thinking: adaptive` + `effort: "medium"`.
- **Haiku 4.5** : pas d'`effort` (Haiku ne le supporte pas).

## Vidéo de fond

Déposez votre fichier vidéo ici : `public/videos/background.mp4`.

- Format : `.mp4` (H.264) recommandé pour la compatibilité navigateur.
- Pour changer le chemin, éditez `app/page.tsx` (`<VideoStage src="/videos/..." />`).
- Pour changer la durée de l'intro ou l'opacité de fond, éditez `components/video-stage.tsx`
  (`INTRO_DURATION_MS` et la classe `opacity-40`).

## Connexion Supabase

1. Créez un projet sur https://supabase.com.
2. Récupérez l'URL et la clé `anon` dans **Project Settings → API**.
3. Renseignez-les dans `.env.local` (ou dans les variables d'environnement
   de Vercel : **Project Settings → Environment Variables**).

> Sans ces variables, l'application fonctionne quand même : l'auth GitHub
> est simplement désactivée (un badge « Auth non configurée » s'affiche
> au lieu du bouton de connexion). Cela évite l'erreur 500 au déploiement.

## Connexion GitHub (OAuth via Supabase)

1. Sur GitHub : **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Homepage URL : `http://localhost:3000` (en dev)
   - Authorization callback URL : `https://<votre-projet>.supabase.co/auth/v1/callback`
2. Sur Supabase : **Authentication → Providers → GitHub**, activez et collez le Client ID / Client Secret.
3. Sur Supabase : **Authentication → URL Configuration**, ajoutez `http://localhost:3000/auth/callback`
   à la liste des Redirect URLs.

Le bouton « Se connecter avec GitHub » lance ensuite le flux OAuth.
