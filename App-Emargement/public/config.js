// Configuration de l'interface web
window.EMARGEMENT_CONFIG = {
    // Configuration par défaut
    defaultApiUrl: 'http://localhost:3000/api/emargement',
    defaultApiKey: 'votre_cle_api_secrete_ici',
    
    // Messages
    messages: {
        success: {
            pdfGenerated: 'PDF généré avec succès !',
            jsonExported: 'JSON exporté avec succès !',
            apiTestSuccess: 'Test API réussi !'
        },
        error: {
            invalidForm: 'Veuillez remplir tous les champs obligatoires',
            apiError: 'Erreur lors de l\'appel API',
            networkError: 'Erreur de connexion réseau',
            serverError: 'Erreur serveur'
        },
        warning: {
            incompleteData: 'Certaines données sont manquantes'
        },
        info: {
            loading: 'Génération du PDF en cours...',
            saving: 'Sauvegarde en cours...'
        }
    },
    
    // Validation
    validation: {
        requiredFields: ['nom', 'prenom', 'code_session', 'date_cours', 'nom_formation', 'nom_cours'],
        maxIntervenants: 10,
        maxFieldLength: 100
    },
    
    // Interface
    ui: {
        autoSaveInterval: 5000, // 5 secondes
        notificationTimeout: 5000, // 5 secondes
        maxJsonPreviewHeight: 600
    }
}; 