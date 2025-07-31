# Application d'Émargement - Version React

Cette version moderne de l'application utilise **React 18** avec **TypeScript** et **Vite** pour une expérience de développement optimale.

## 🔒 Sécurité

### Mesures de sécurité implémentées :

- **Clé API sécurisée** : `IFG_EMARGEMENT_2025_SECURE_KEY` par défaut
- **Rate limiting** : 100 requêtes par IP toutes les 15 minutes
- **Validation TypeScript** : Typage strict pour éviter les erreurs
- **Validation des données** : Vérification côté client et serveur
- **CORS configuré** : Origines autorisées uniquement
- **Content Security Policy** : Protection contre les attaques XSS
- **Validation des URLs** : Contrôle des URLs de signature
- **Gestion d'erreurs** : Messages d'erreur sécurisés

### Protection contre :

- **Injection de code** : Validation stricte des entrées
- **XSS** : CSP headers et échappement des données
- **CSRF** : Validation de l'origine des requêtes
- **DDoS** : Rate limiting par IP
- **Data leaks** : Validation des données sensibles

## 🚀 Technologies utilisées

- **React 18** - Interface utilisateur moderne
- **TypeScript** - Typage statique pour la sécurité du code
- **Vite** - Build tool ultra-rapide
- **Express.js** - API backend
- **PDFKit** - Génération de PDF
- **Axios** - Appels HTTP
- **Helmet.js** - Sécurité HTTP
- **Rate Limiting** - Protection contre les abus

## 📦 Installation

### Option 1 : Installation automatique
```bash
install-react.bat
```

### Option 2 : Installation manuelle

1. **Installer les dépendances :**
```bash
npm install
```

2. **Configurer l'environnement :**
```bash
copy config.env .env
```

3. **Build de l'application React :**
```bash
npm run build
```

## 🏃‍♂️ Démarrage

### Mode développement
```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend (optionnel pour le développement)
npm run dev:frontend
```

### Mode production
```bash
npm run build
npm start
```

## 🌐 URLs

- **Backend API :** http://localhost:3000
- **Frontend React :** http://localhost:3001 (dev) / http://localhost:3000 (prod)

## 🏗️ Architecture

```
src/
├── components/          # Composants React
│   ├── Header.tsx
│   ├── FormField.tsx
│   ├── Button.tsx
│   ├── ParticipantForm.tsx
│   ├── IntervenantsForm.tsx
│   ├── ApiConfigForm.tsx
│   ├── JsonPreview.tsx
│   └── Notification.tsx
├── hooks/              # Hooks React personnalisés
│   └── useLocalStorage.ts
├── services/           # Services API
│   └── api.ts
├── types/              # Types TypeScript
│   └── index.ts
├── App.tsx             # Composant principal
├── main.tsx            # Point d'entrée
├── index.css           # Styles globaux
└── App.css             # Styles de l'application
```

## ✨ Fonctionnalités React

### 🎯 Avantages de la version React

1. **TypeScript** - Sécurité du typage et meilleure DX
2. **Composants réutilisables** - Code modulaire et maintenable
3. **Hooks personnalisés** - Logique métier réutilisable
4. **État local persistant** - Sauvegarde automatique dans localStorage
5. **Interface réactive** - Mise à jour en temps réel
6. **Gestion d'état moderne** - useState et useReducer
7. **Validation en temps réel** - Feedback immédiat
8. **Notifications toast** - UX améliorée

### 🔧 Composants principaux

#### `ParticipantForm`
- Formulaire pour les informations du participant
- Validation en temps réel
- Champs obligatoires marqués

#### `IntervenantsForm`
- Gestion dynamique des intervenants
- Ajout/suppression d'intervenants
- Interface drag & drop (futur)

#### `JsonPreview`
- Aperçu JSON en temps réel
- Syntax highlighting
- Copie en un clic

#### `Notification`
- Système de notifications toast
- Types : success, error, warning, info
- Auto-dismiss configurable

### 🎨 Interface utilisateur

- **Design moderne** avec CSS variables
- **Responsive design** pour tous les appareils
- **Animations fluides** avec CSS transitions
- **Thème sombre/clair** (futur)
- **Accessibilité** optimisée

## 🔄 Workflow de développement

### 1. Développement
```bash
npm run dev:frontend  # Démarre Vite sur le port 3001
npm start            # Démarre l'API sur le port 3000
```

### 2. Build de production
```bash
npm run build        # Build React dans /dist
npm start            # Démarre le serveur avec l'app React
```

### 3. Preview
```bash
npm run preview      # Lance un serveur de preview
```

## 🧪 Tests

### Tests API
```bash
node test-api.js
```

### Tests React (futur)
```bash
npm test
```

## 📱 Responsive Design

L'application s'adapte automatiquement à tous les écrans :

- **Desktop** (> 1024px) : Layout en 2 colonnes
- **Tablet** (768px - 1024px) : Layout adaptatif
- **Mobile** (< 768px) : Layout en 1 colonne

## 🔧 Configuration

### Variables d'environnement
```env
PORT=3000
API_KEY=IFG_EMARGEMENT_2025_SECURE_KEY
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuration Vite
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
```

## 🚀 Déploiement

### Production
1. Build de l'application :
   ```bash
   npm run build
   ```

2. Démarrage du serveur :
   ```bash
   npm start
   ```

### Docker (futur)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔮 Roadmap

### Prochaines fonctionnalités
- [ ] **Drag & Drop** pour les intervenants
- [ ] **Thème sombre/clair**
- [ ] **Tests unitaires** avec Jest
- [ ] **Tests E2E** avec Playwright
- [ ] **PWA** (Progressive Web App)
- [ ] **Offline mode**
- [ ] **Internationalisation** (i18n)
- [ ] **Analytics** intégrés

### Améliorations techniques
- [ ] **State management** avec Zustand/Redux
- [ ] **Form validation** avec React Hook Form
- [ ] **UI components** avec Radix UI
- [ ] **Animations** avec Framer Motion
- [ ] **Code splitting** et lazy loading

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆚 Comparaison avec la version vanilla

| Fonctionnalité | Vanilla JS | React |
|----------------|------------|-------|
| **TypeScript** | ❌ | ✅ |
| **Composants réutilisables** | ❌ | ✅ |
| **État persistant** | ✅ | ✅ |
| **Validation temps réel** | ✅ | ✅ |
| **Notifications** | ✅ | ✅ |
| **Build optimisé** | ❌ | ✅ |
| **Hot reload** | ❌ | ✅ |
| **Code splitting** | ❌ | ✅ |
| **Maintenabilité** | ⚠️ | ✅ |
| **Performance** | ✅ | ✅ |

## 📞 Support

Pour toute question ou problème :
- Consultez la documentation
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement 