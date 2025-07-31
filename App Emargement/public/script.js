// Variables globales
let intervenants = [];
let intervenantCounter = 0;

// Éléments DOM
const elements = {
    // Formulaire participant
    nom: document.getElementById('nom'),
    prenom: document.getElementById('prenom'),
    code_session: document.getElementById('code_session'),
    date_cours: document.getElementById('date_cours'),
    nom_formation: document.getElementById('nom_formation'),
    nom_cours: document.getElementById('nom_cours'),
    signature_matin: document.getElementById('signature_matin'),
    signature_soir: document.getElementById('signature_soir'),
    
    // Configuration API
    api_url: document.getElementById('api_url'),
    api_key: document.getElementById('api_key'),
    
    // Conteneurs
    intervenantsContainer: document.getElementById('intervenants-container'),
    jsonPreview: document.getElementById('json-preview'),
    
    // Boutons
    ajouterIntervenant: document.getElementById('ajouter-intervenant'),
    genererPdf: document.getElementById('generer-pdf'),
    testApi: document.getElementById('test-api'),
    exporterJson: document.getElementById('exporter-json'),
    
    // Overlays
    loadingOverlay: document.getElementById('loading-overlay'),
    notification: document.getElementById('notification')
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateJsonPreview();
});

function initializeApp() {
    // Définir la date d'aujourd'hui par défaut
    const today = new Date().toISOString().split('T')[0];
    elements.date_cours.value = today;
    
    // Charger les valeurs par défaut depuis le localStorage
    loadFromLocalStorage();
}

function setupEventListeners() {
    // Écouteurs pour les champs du formulaire
    Object.values(elements).forEach(element => {
        if (element && element.tagName === 'INPUT') {
            element.addEventListener('input', updateJsonPreview);
        }
    });
    
    // Boutons
    elements.ajouterIntervenant.addEventListener('click', ajouterIntervenant);
    elements.genererPdf.addEventListener('click', genererPdf);
    elements.testApi.addEventListener('click', testApi);
    elements.exporterJson.addEventListener('click', exporterJson);
    
    // Notification
    const notificationClose = elements.notification.querySelector('.notification-close');
    notificationClose.addEventListener('click', hideNotification);
    
    // Sauvegarder automatiquement
    setInterval(saveToLocalStorage, 5000);
}

// Gestion des intervenants
function ajouterIntervenant() {
    const intervenant = {
        id: ++intervenantCounter,
        nom: '',
        prenom: '',
        signature_matin: '',
        signature_soir: ''
    };
    
    intervenants.push(intervenant);
    renderIntervenants();
    updateJsonPreview();
}

function supprimerIntervenant(id) {
    intervenants = intervenants.filter(i => i.id !== id);
    renderIntervenants();
    updateJsonPreview();
}

function renderIntervenants() {
    elements.intervenantsContainer.innerHTML = '';
    
    if (intervenants.length === 0) {
        elements.intervenantsContainer.innerHTML = `
            <div class="empty-state">
                <p>Aucun intervenant ajouté. Cliquez sur "Ajouter un intervenant" pour commencer.</p>
            </div>
        `;
        return;
    }
    
    intervenants.forEach(intervenant => {
        const card = document.createElement('div');
        card.className = 'intervenant-card';
        card.innerHTML = `
            <div class="intervenant-header">
                <span class="intervenant-title">Intervenant ${intervenant.id}</span>
                <button type="button" class="btn-remove" onclick="supprimerIntervenant(${intervenant.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Nom</label>
                    <input type="text" 
                           placeholder="Nom de l'intervenant" 
                           value="${intervenant.nom}"
                           onchange="updateIntervenant(${intervenant.id}, 'nom', this.value)">
                </div>
                <div class="form-group">
                    <label>Prénom</label>
                    <input type="text" 
                           placeholder="Prénom de l'intervenant" 
                           value="${intervenant.prenom}"
                           onchange="updateIntervenant(${intervenant.id}, 'prenom', this.value)">
                </div>
                <div class="form-group">
                    <label>Signature Matin (URL)</label>
                    <input type="url" 
                           placeholder="https://example.com/signature.png" 
                           value="${intervenant.signature_matin}"
                           onchange="updateIntervenant(${intervenant.id}, 'signature_matin', this.value)">
                </div>
                <div class="form-group">
                    <label>Signature Soir (URL)</label>
                    <input type="url" 
                           placeholder="https://example.com/signature.png" 
                           value="${intervenant.signature_soir}"
                           onchange="updateIntervenant(${intervenant.id}, 'signature_soir', this.value)">
                </div>
            </div>
        `;
        elements.intervenantsContainer.appendChild(card);
    });
}

function updateIntervenant(id, field, value) {
    const intervenant = intervenants.find(i => i.id === id);
    if (intervenant) {
        intervenant[field] = value;
        updateJsonPreview();
    }
}

// Génération du JSON
function generateJsonData() {
    const participant = {
        nom: elements.nom.value,
        prenom: elements.prenom.value,
        signature_matin: elements.signature_matin.value || '',
        signature_soir: elements.signature_soir.value || '',
        code_session: elements.code_session.value,
        date_du_cours: formatDate(elements.date_cours.value),
        nom_formation: elements.nom_formation.value,
        nom_du_cours: elements.nom_cours.value
    };
    
    return {
        participant,
        intervenants: intervenants.map(i => ({
            nom: i.nom,
            prenom: i.prenom,
            signature_matin: i.signature_matin || '',
            signature_soir: i.signature_soir || ''
        }))
    };
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function updateJsonPreview() {
    const data = generateJsonData();
    elements.jsonPreview.textContent = JSON.stringify(data, null, 2);
}

// API calls
async function genererPdf() {
    if (!validateForm()) {
        showNotification('Veuillez remplir tous les champs obligatoires', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const data = generateJsonData();
        const response = await fetch(elements.api_url.value, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': elements.api_key.value
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        downloadPdf(blob, `emargement_${new Date().toISOString().slice(0, 10)}.pdf`);
        
        showNotification('PDF généré avec succès !', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function testApi() {
    showLoading();
    
    try {
        const testUrl = elements.api_url.value.replace('/emargement', '/test');
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'x-api-key': elements.api_key.value
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        downloadPdf(blob, 'test_emargement.pdf');
        
        showNotification('Test API réussi !', 'success');
        
    } catch (error) {
        console.error('Erreur lors du test API:', error);
        showNotification(`Erreur de test: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function exporterJson() {
    const data = generateJsonData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emargement_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('JSON exporté avec succès !', 'success');
}

// Utilitaires
function validateForm() {
    const requiredFields = [
        elements.nom,
        elements.prenom,
        elements.code_session,
        elements.date_cours,
        elements.nom_formation,
        elements.nom_cours
    ];
    
    return requiredFields.every(field => field.value.trim() !== '');
}

function downloadPdf(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// UI Helpers
function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showNotification(message, type = 'info') {
    const notification = elements.notification;
    const messageEl = notification.querySelector('.notification-message');
    const iconEl = notification.querySelector('.notification-icon');
    
    // Nettoyer les classes précédentes
    notification.className = 'notification';
    
    // Ajouter les nouvelles classes
    notification.classList.add(type);
    
    // Définir le message et l'icône
    messageEl.textContent = message;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    iconEl.className = `notification-icon ${icons[type] || icons.info}`;
    
    // Afficher la notification
    notification.classList.remove('hidden');
    
    // Masquer automatiquement après 5 secondes
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    elements.notification.classList.add('hidden');
}

// Local Storage
function saveToLocalStorage() {
    const data = {
        participant: {
            nom: elements.nom.value,
            prenom: elements.prenom.value,
            code_session: elements.code_session.value,
            date_cours: elements.date_cours.value,
            nom_formation: elements.nom_formation.value,
            nom_cours: elements.nom_cours.value,
            signature_matin: elements.signature_matin.value,
            signature_soir: elements.signature_soir.value
        },
        api: {
            url: elements.api_url.value,
            key: elements.api_key.value
        },
        intervenants: intervenants
    };
    
    localStorage.setItem('emargement_data', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('emargement_data');
    if (!saved) return;
    
    try {
        const data = JSON.parse(saved);
        
        // Charger les données du participant
        if (data.participant) {
            elements.nom.value = data.participant.nom || '';
            elements.prenom.value = data.participant.prenom || '';
            elements.code_session.value = data.participant.code_session || '';
            elements.date_cours.value = data.participant.date_cours || '';
            elements.nom_formation.value = data.participant.nom_formation || '';
            elements.nom_cours.value = data.participant.nom_cours || '';
            elements.signature_matin.value = data.participant.signature_matin || '';
            elements.signature_soir.value = data.participant.signature_soir || '';
        }
        
        // Charger la configuration API
        if (data.api) {
            elements.api_url.value = data.api.url || 'http://localhost:3000/api/emargement';
            elements.api_key.value = data.api.key || '';
        }
        
        // Charger les intervenants
        if (data.intervenants && Array.isArray(data.intervenants)) {
            intervenants = data.intervenants;
            if (intervenants.length > 0) {
                intervenantCounter = Math.max(...intervenants.map(i => i.id));
            }
            renderIntervenants();
        }
        
        updateJsonPreview();
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
}

// Exposer les fonctions globalement pour les événements inline
window.supprimerIntervenant = supprimerIntervenant;
window.updateIntervenant = updateIntervenant; 