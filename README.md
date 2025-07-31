# Application d'Émargement

Cette application génère des feuilles d'émargement au format PDF à partir de données JSON. Elle est conçue pour être intégrée avec Power Automate et Power Apps.

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
   - Copier `config.env` vers `.env`
   - Modifier la clé API dans le fichier `.env`

3. Démarrer l'application :
```bash
npm start
```

4. Accéder à l'interface web :
   - Ouvrir votre navigateur
   - Aller à `http://localhost:3000`
   - L'interface graphique moderne vous permettra de tester l'API

## Utilisation

### Endpoint principal : `/api/emargement`

**Méthode :** POST  
**Authentification :** Clé API requise dans les en-têtes

**En-têtes requis :**
```
x-api-key: IFG_EMARGEMENT_2025_SECURE_KEY
Content-Type: application/json
```

**Structure JSON attendue :**
```json
{
  "participant": {
    "nom": "string",
    "prenom": "string",
    "signature_matin": "lien gravity ou png",
    "signature_soir": "lien gravity ou png",
    "code_session": "string",
    "date_du_cours": "date jj/mm/aaaa",
    "nom_formation": "string",
    "nom_du_cours": "string"
  },
  "intervenants": [
    {
      "nom": "string",
      "prenom": "string",
      "signature_matin": "lien gravity ou png",
      "signature_soir": "lien gravity ou png"
    }
  ]
}
```

**Exemple JSON complet :**
```json
{
  "participant": {
    "nom": "Dupont",
    "prenom": "Jean",
    "signature_matin": "https://example.com/signature1.png",
    "signature_soir": "https://example.com/signature2.png",
    "code_session": "SESS-2025-001",
    "date_du_cours": "15/01/2025",
    "nom_formation": "Formation Développement Web",
    "nom_du_cours": "JavaScript Avancé"
  },
  "intervenants": [
    {
      "nom": "Martin",
      "prenom": "Sophie",
      "signature_matin": "https://example.com/signature3.png",
      "signature_soir": "https://example.com/signature4.png"
    },
    {
      "nom": "Bernard",
      "prenom": "Pierre",
      "signature_matin": "https://example.com/signature5.png",
      "signature_soir": "https://example.com/signature6.png"
    }
  ]
}
```

**Clé API par défaut :** `IFG_EMARGEMENT_2025_SECURE_KEY`

**Réponse :** Fichier PDF en binaire

### Endpoint de test : `/api/test`

**Méthode :** POST  
**Authentification :** Clé API requise

Génère un PDF de test avec des données d'exemple.

### Endpoint de santé : `/api/health`

**Méthode :** GET  
**Authentification :** Aucune

Vérifie que l'API fonctionne correctement.

## Interface Web

L'application inclut une interface web moderne accessible à `http://localhost:3000` qui permet de :

- **Saisir les données** : Formulaire intuitif pour les informations du participant et des intervenants
- **Aperçu JSON** : Visualisation en temps réel de la structure JSON générée
- **Test API** : Test direct de l'API avec génération de PDF de test
- **Export JSON** : Export des données au format JSON
- **Sauvegarde automatique** : Les données sont sauvegardées automatiquement dans le navigateur
- **Interface responsive** : Compatible avec tous les appareils

### Fonctionnalités de l'interface :

1. **Gestion des participants** : Saisie des informations principales
2. **Gestion des intervenants** : Ajout/suppression dynamique d'intervenants
3. **Configuration API** : Paramétrage de l'URL et de la clé API
4. **Aperçu en temps réel** : Visualisation du JSON généré
5. **Génération PDF** : Création directe de feuilles d'émargement
6. **Tests intégrés** : Validation de l'API et des données

## Intégration avec Power Automate

1. **HTTP Request Action :**
   - Méthode : POST
   - URL : `http://votre-serveur:3000/api/emargement`
   - Headers :
     ```
     x-api-key: votre_cle_api_secrete
     Content-Type: application/json
     ```
   - Body : Votre structure JSON

2. **Traitement de la réponse :**
   - Le PDF est retourné en binaire
   - Utilisez l'action "Create file" pour sauvegarder le PDF

## Intégration avec Power Apps

1. **Collection de données :**
   ```javascript
   // Exemple de collection dans Power Apps
   ClearCollect(EmargementData, {
       participant: {
           nom: txtNom.Text,
           prenom: txtPrenom.Text,
           code_session: txtSession.Text,
           date_du_cours: txtDate.Text,
           nom_formation: txtFormation.Text,
           nom_du_cours: txtCours.Text
       },
       intervenants: IntervenantsCollection
   });
   ```

2. **Appel API :**
   ```javascript
   // Dans Power Apps
   Set(varResponse, 
       Patch('http://votre-serveur:3000/api/emargement',
           EmargementData,
           {
               headers: {
                   'x-api-key': 'votre_cle_api_secrete',
                   'Content-Type': 'application/json'
               }
           }
       )
   );
   ```

## Sécurité

### 🔐 Mesures de sécurité implémentées :

- **Authentification par clé API** : Clé par défaut `IFG_EMARGEMENT_2025_SECURE_KEY`
- **Rate limiting** : 100 requêtes par IP toutes les 15 minutes
- **Validation des données** : Vérification stricte des champs obligatoires
- **Validation des URLs** : Contrôle des URLs de signature
- **Helmet.js** : Headers de sécurité HTTP
- **CORS configuré** : Origines autorisées uniquement
- **Content Security Policy** : Protection contre les attaques XSS
- **Validation des dates** : Format JJ/MM/AAAA obligatoire
- **Limite d'intervenants** : Maximum 50 intervenants par requête

### 🛡️ Protection contre :

- **Injection SQL** : Pas de base de données, validation côté serveur
- **XSS** : CSP headers, échappement des données
- **CSRF** : Validation de l'origine des requêtes
- **DDoS** : Rate limiting par IP
- **Data validation** : Validation stricte des entrées utilisateur

## Déploiement

### Local
```bash
npm start
```

### Production
1. Configurer les variables d'environnement
2. Utiliser un process manager comme PM2
3. Configurer un reverse proxy (nginx)

## Structure du projet

```
app-emargement/
├── server.js              # Serveur principal
├── package.json           # Dépendances
├── config.env             # Configuration
├── README.md              # Documentation
├── public/                # Interface web
│   ├── index.html         # Page principale
│   ├── styles.css         # Styles modernes
│   ├── script.js          # Logique JavaScript
│   └── config.js          # Configuration interface
├── test-api.js            # Script de test
├── install.bat            # Installation automatique
├── powerapps-integration.md  # Guide Power Apps
├── power-automate-config.json # Configuration Power Automate
└── documents_référence/   # Documents de référence
```

## 🔄 FONCTIONNEMENT

### 📋 Vue d'ensemble du processus

L'application suit un flux de traitement complet depuis la réception des données jusqu'à la génération du PDF final.

### 🎯 Étape 1 : Réception des données

**Point d'entrée :** `POST /api/emargement`

```json
{
  "participant": {
    "nom": "Dupont",
    "prenom": "Jean",
    "signature_matin": "https://example.com/signature1.png",
    "signature_soir": "https://example.com/signature2.png",
    "code_session": "SESS-2025-001",
    "date_du_cours": "15/01/2025",
    "nom_formation": "Formation Développement Web",
    "nom_du_cours": "JavaScript Avancé"
  },
  "intervenants": [...]
}
```

### 🔐 Étape 2 : Authentification et sécurité

1. **Vérification de la clé API** : `x-api-key: IFG_EMARGEMENT_2025_SECURE_KEY`
2. **Rate limiting** : Vérification des limites de requêtes par IP
3. **Validation CORS** : Contrôle de l'origine de la requête

### ✅ Étape 3 : Validation des données

**Validation du participant :**
- Champs obligatoires : nom, prénom, code_session, date_du_cours, nom_formation, nom_du_cours
- Format de date : JJ/MM/AAAA
- URLs de signature (optionnelles) : Validation des protocoles http/https

**Validation des intervenants :**
- Maximum 50 intervenants
- Nom et prénom obligatoires pour chaque intervenant
- URLs de signature optionnelles mais validées

### 🏗️ Étape 4 : Préparation des données

```javascript
// Structure des données pour PDFKit
const pdfData = {
  participant: {
    nom: "Dupont",
    prenom: "Jean",
    // ... autres champs
  },
  intervenants: [
    {
      nom: "Martin",
      prenom: "Sophie",
      // ... autres champs
    }
  ]
};
```

### 📄 Étape 5 : Génération du PDF

**Utilisation de PDFKit :**

1. **Création du document :**
   ```javascript
   const doc = new PDFDocument({
     size: 'A4',
     margins: { top: 50, bottom: 50, left: 50, right: 50 }
   });
   ```

2. **En-tête de la feuille :**
   - Titre : "FEUILLE D'ÉMARGEMENT"
   - Informations de formation
   - Date et code de session

3. **Tableau des participants :**
   - En-têtes : Nom, Prénom, Signature Matin, Signature Soir
   - Participant principal en première ligne
   - Intervenants dans les lignes suivantes
   - Placeholders pour les signatures

4. **Pied de page :**
   - Date de génération
   - Mention "Document généré automatiquement"

### 🎨 Étape 6 : Formatage du PDF

**Structure visuelle :**

```
┌─────────────────────────────────────────┐
│         FEUILLE D'ÉMARGEMENT           │
├─────────────────────────────────────────┤
│ FORMATION: Formation Développement Web │
│ COURS: JavaScript Avancé               │
│ DATE: 15/01/2025                      │
│ CODE SESSION: SESS-2025-001           │
├─────────────────────────────────────────┤
│ PARTICIPANTS                           │
├─────────┬─────────┬─────────┬─────────┤
│ Nom     │ Prénom  │ Sig Mat │ Sig Soir│
├─────────┼─────────┼─────────┼─────────┤
│ Dupont  │ Jean    │ [_____] │ [_____] │
│ Martin  │ Sophie  │ [_____] │ [_____] │
└─────────┴─────────┴─────────┴─────────┘
```

### 📤 Étape 7 : Envoi de la réponse

**Headers de réponse :**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="emargement.pdf"
Content-Length: [taille_du_fichier]
```

**Corps de la réponse :**
- Fichier PDF en binaire
- Prêt pour téléchargement ou sauvegarde

### 🔄 Flux complet

```
[Client] → [API] → [Validation] → [PDFKit] → [PDF] → [Client]
   ↓         ↓         ↓           ↓         ↓        ↓
  JSON    Auth     Data      Generate   Binary   Download
  Data    Check    Valid     PDF        PDF      File
```

### ⚡ Optimisations

1. **Performance :**
   - Génération en mémoire (pas de fichiers temporaires)
   - Streaming du PDF pour les gros fichiers
   - Compression automatique

2. **Sécurité :**
   - Validation stricte des entrées
   - Pas d'injection de code possible
   - Headers de sécurité HTTP

3. **Fiabilité :**
   - Gestion d'erreurs complète
   - Validation des données avant traitement
   - Messages d'erreur explicites

### 🧪 Tests intégrés

**Test de santé :** `GET /api/health`
- Vérification de l'état de l'API
- Informations de version
- Timestamp de réponse

**Test de génération :** `POST /api/test`
- Génération d'un PDF de test
- Validation du processus complet
- Données d'exemple incluses

### 📊 Métriques de performance

- **Temps de génération :** ~100-500ms selon la complexité
- **Taille du PDF :** ~50-200KB selon le nombre d'intervenants
- **Mémoire utilisée :** ~10-50MB pendant la génération
- **Concurrence :** Support de multiples requêtes simultanées

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de développement. 