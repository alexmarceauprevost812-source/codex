# Codex

Application de chat style ChatGPT avec :
- Une vidéo d'intro (4 secondes en plein écran)
- Puis cette même vidéo en fond à 40 % d'opacité
- Une interface de chat aux bulles et boutons arrondis
- Authentification GitHub via Supabase Auth

## Démarrage

```bash
pnpm install
cp .env.local.example .env.local
# Remplissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev
```

Ouvrez http://localhost:3000.

## Vidéo de fond

Déposez votre fichier vidéo ici : `public/videos/background.mp4`.

- Format : `.mp4` (H.264) recommandé pour la compatibilité navigateur.
- Pour changer le chemin, éditez `app/page.tsx` (`<VideoStage src="/videos/..." />`).
- Pour changer la durée de l'intro ou l'opacité de fond, éditez `components/video-stage.tsx`
  (`INTRO_DURATION_MS` et la classe `opacity-40`).

## Connexion Supabase

1. Créez un projet sur https://supabase.com.
2. Récupérez l'URL et la clé `anon` dans **Project Settings → API**.
3. Renseignez-les dans `.env.local`.

## Connexion GitHub (OAuth via Supabase)

1. Sur GitHub : **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Homepage URL : `http://localhost:3000` (en dev)
   - Authorization callback URL : `https://<votre-projet>.supabase.co/auth/v1/callback`
2. Sur Supabase : **Authentication → Providers → GitHub**, activez et collez le Client ID / Client Secret.
3. Sur Supabase : **Authentication → URL Configuration**, ajoutez `http://localhost:3000/auth/callback`
   à la liste des Redirect URLs.

Le bouton « Se connecter avec GitHub » lance ensuite le flux OAuth.
