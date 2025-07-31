# Intégration Power Apps - Application d'Émargement

Ce guide détaille l'intégration de l'API d'émargement avec Power Apps.

## Configuration dans Power Apps

### 1. Création de la source de données

Dans Power Apps Studio, ajoutez une nouvelle source de données HTTP :

1. Allez dans **Data** > **Add data source**
2. Sélectionnez **HTTP with Azure AD**
3. Configurez l'URL : `http://votre-serveur:3000/api/emargement`
4. Ajoutez les en-têtes :
   ```
   x-api-key: votre_cle_api_secrete
   Content-Type: application/json
   ```

### 2. Structure des données

Créez une collection pour stocker les données d'émargement :

```javascript
// Dans Power Apps, créez cette collection
ClearCollect(EmargementData, {
    participant: {
        nom: txtNom.Text,
        prenom: txtPrenom.Text,
        signature_matin: "",
        signature_soir: "",
        code_session: txtSession.Text,
        date_du_cours: txtDate.Text,
        nom_formation: txtFormation.Text,
        nom_du_cours: txtCours.Text
    },
    intervenants: IntervenantsCollection
});
```

### 3. Interface utilisateur recommandée

#### Écran principal (EmargementScreen)

**Contrôles pour le participant :**
- `txtNom` (Text Input) - Nom du participant
- `txtPrenom` (Text Input) - Prénom du participant
- `txtSession` (Text Input) - Code de session
- `txtDate` (Date Picker) - Date du cours
- `txtFormation` (Text Input) - Nom de la formation
- `txtCours` (Text Input) - Nom du cours

**Contrôles pour les intervenants :**
- `galIntervenants` (Gallery) - Liste des intervenants
- `btnAjouterIntervenant` (Button) - Ajouter un intervenant
- `btnSupprimerIntervenant` (Button) - Supprimer un intervenant

**Bouton de génération :**
- `btnGenererPDF` (Button) - Générer le PDF

### 4. Code Power Apps

#### Initialisation de l'écran

```javascript
// Dans OnStart de l'écran
ClearCollect(IntervenantsCollection, {
    nom: "",
    prenom: "",
    signature_matin: "",
    signature_soir: ""
});
```

#### Ajouter un intervenant

```javascript
// Dans OnSelect de btnAjouterIntervenant
Collect(IntervenantsCollection, {
    nom: "",
    prenom: "",
    signature_matin: "",
    signature_soir: ""
});
```

#### Supprimer un intervenant

```javascript
// Dans OnSelect de btnSupprimerIntervenant
Remove(IntervenantsCollection, galIntervenants.Selected);
```

#### Générer le PDF

```javascript
// Dans OnSelect de btnGenererPDF
Set(varIsLoading, true);

// Préparer les données
ClearCollect(EmargementData, {
    participant: {
        nom: txtNom.Text,
        prenom: txtPrenom.Text,
        signature_matin: "",
        signature_soir: "",
        code_session: txtSession.Text,
        date_du_cours: Text(txtDate.SelectedDate, "dd/mm/yyyy"),
        nom_formation: txtFormation.Text,
        nom_du_cours: txtCours.Text
    },
    intervenants: IntervenantsCollection
});

// Appeler l'API
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

// Traiter la réponse
If(IsBlank(varResponse.Error),
    // Succès
    Notify("PDF généré avec succès!", NotificationType.Success);
    Set(varIsLoading, false);
    ,
    // Erreur
    Notify("Erreur lors de la génération: " & varResponse.Error, NotificationType.Error);
    Set(varIsLoading, false);
);
```

### 5. Validation des données

```javascript
// Fonction de validation
Set(varIsValid, 
    !IsBlank(txtNom.Text) &&
    !IsBlank(txtPrenom.Text) &&
    !IsBlank(txtSession.Text) &&
    !IsBlank(txtFormation.Text) &&
    !IsBlank(txtCours.Text)
);

// Dans OnSelect de btnGenererPDF, ajoutez :
If(varIsValid,
    // Code de génération
    ,
    Notify("Veuillez remplir tous les champs obligatoires", NotificationType.Warning)
);
```

### 6. Gestion des signatures

Pour intégrer les signatures Gravity Forms :

```javascript
// Dans la structure des données
participant: {
    nom: txtNom.Text,
    prenom: txtPrenom.Text,
    signature_matin: imgSignatureMatin.Image, // URL de l'image
    signature_soir: imgSignatureSoir.Image,   // URL de l'image
    code_session: txtSession.Text,
    date_du_cours: Text(txtDate.SelectedDate, "dd/mm/yyyy"),
    nom_formation: txtFormation.Text,
    nom_du_cours: txtCours.Text
}
```

### 7. Configuration avancée

#### Variables globales

```javascript
// Dans App.OnStart
Set(gblApiUrl, "http://votre-serveur:3000");
Set(gblApiKey, "votre_cle_api_secrete");
Set(gblMaxIntervenants, 10);
```

#### Gestion des erreurs

```javascript
// Fonction de gestion d'erreur
Set(varHandleError, 
    Switch(varResponse.StatusCode,
        200, Notify("PDF généré avec succès!", NotificationType.Success),
        401, Notify("Clé API invalide", NotificationType.Error),
        400, Notify("Données invalides: " & varResponse.Error, NotificationType.Error),
        500, Notify("Erreur serveur", NotificationType.Error),
        Notify("Erreur inconnue", NotificationType.Error)
    )
);
```

## Déploiement

### 1. Test local

1. Démarrez l'API : `npm start`
2. Testez avec l'application de test : `node test-api.js`
3. Configurez Power Apps en mode développement

### 2. Production

1. Déployez l'API sur un serveur accessible
2. Mettez à jour les URLs dans Power Apps
3. Configurez les clés API de production
4. Testez l'intégration complète

## Dépannage

### Problèmes courants

1. **Erreur 401** : Vérifiez la clé API
2. **Erreur 400** : Validez la structure JSON
3. **Timeout** : Vérifiez la connectivité réseau
4. **PDF vide** : Vérifiez les données d'entrée

### Logs de débogage

Dans Power Apps, ajoutez des notifications temporaires :

```javascript
Notify("Données: " & JSON(EmargementData), NotificationType.Information);
```

## Support

Pour toute question sur l'intégration Power Apps, consultez la documentation ou contactez l'équipe de développement. 