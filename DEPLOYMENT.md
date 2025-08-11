# Déploiement Vercel - Application d'Émargement

## Structure du projet pour Vercel

```
/
├── api/                    # Fonctions serverless Vercel
│   ├── server.js          # API principale
│   ├── templates/         # Templates EJS
│   └── logos/            # Logos pour les PDF
├── App Emargement/        # Application React
│   ├── src/              # Code source React
│   ├── dist/             # Build de production (généré)
│   └── package.json      # Dépendances React
├── dist/                 # Build final (généré par Vercel)
├── vercel.json           # Configuration Vercel
└── package.json          # Scripts de build
```

## Configuration Vercel

Le fichier `vercel.json` configure :
- **Functions** : API serverless dans `/api/`
- **Routes** : Redirection des requêtes API vers `/api/server.js`
- **Build** : Compilation du frontend React
- **Output** : Dossier de sortie `dist/`

## Variables d'environnement requises

Sur Vercel, configurez ces variables :
- `API_KEY` : Clé d'authentification API
- `NODE_ENV` : `production`
- `PORT` : Port (géré automatiquement par Vercel)

## Déploiement

1. **Connectez votre repository GitHub à Vercel**
2. **Configurez les variables d'environnement** dans les paramètres Vercel
3. **Déployez** - Vercel détectera automatiquement la configuration

## URLs de déploiement

- **Frontend** : `https://votre-app.vercel.app/`
- **API** : `https://votre-app.vercel.app/api/emargement`
- **Health Check** : `https://votre-app.vercel.app/api/health`

## Résolution des problèmes

### Erreur de permission
- ✅ Résolu : Utilisation de `npx vite` au lieu de `vite` directement
- ✅ Résolu : Structure sans espaces dans les noms de fichiers

### Erreur de nom de fonction
- ✅ Résolu : Déplacement du serveur dans `/api/server.js`
- ✅ Résolu : Configuration des routes appropriées

## Développement local

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build de production
npm run build
```
