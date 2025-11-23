# Déploiement sur Vercel

Ce projet est optimisé pour Vercel qui offre un meilleur support pour Next.js et des timeouts plus longs (60 secondes) pour la génération de proposals.

## Étapes de déploiement

### 1. Créer un compte Vercel
- Aller sur [vercel.com](https://vercel.com)
- Se connecter avec votre compte GitHub

### 2. Importer le projet
- Cliquer sur "Add New..." → "Project"
- Sélectionner votre repository GitHub : `akainooai-cmyk/MVPSANDIEGODIPLO`
- Vercel détectera automatiquement que c'est un projet Next.js

### 3. Configurer les variables d'environnement

Dans les paramètres du projet Vercel, ajouter ces variables d'environnement :

**IMPORTANT** : Copier les valeurs depuis votre fichier `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=<votre_url_supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre_clé_anon_supabase>
SUPABASE_SERVICE_ROLE_KEY=<votre_clé_service_role_supabase>
ANTHROPIC_API_KEY=<votre_clé_api_anthropic>
```

Les vraies valeurs se trouvent dans votre fichier `.env.local` local (non versionné).

### 4. Déployer
- Cliquer sur "Deploy"
- Vercel va build et déployer automatiquement
- Vous recevrez une URL de production (ex: `your-project.vercel.app`)

### 5. Configurer le domaine (optionnel)
- Dans les paramètres du projet, aller dans "Domains"
- Ajouter votre domaine personnalisé si vous en avez un

## Avantages de Vercel vs Netlify

| Fonctionnalité | Netlify | Vercel |
|----------------|---------|--------|
| Timeout des fonctions | 10-26s | 60s+ |
| Support Next.js | Plugin tiers | Natif |
| Génération de proposals | ❌ Timeout | ✅ Fonctionne |
| Prix | Gratuit limité | Gratuit plus généreux |

## Configuration automatique

Le fichier `vercel.json` configure automatiquement :
- ✅ Timeout de 60 secondes pour `/api/proposals/generate`
- ✅ Build Next.js optimisé
- ✅ Variables d'environnement

## Redéploiement automatique

Chaque push sur la branche `main` déclenchera automatiquement un nouveau déploiement sur Vercel.

## Support

Si vous rencontrez des problèmes :
1. Vérifier les logs de build dans le dashboard Vercel
2. Vérifier que toutes les variables d'environnement sont bien définies
3. Tester en local avec `npm run dev` d'abord
