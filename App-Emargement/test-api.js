const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:3000';
const API_KEY = 'IFG_EMARGEMENT_2025_SECURE_KEY';

// Données de test
const testData = {
  participant: {
    nom: "Dupont",
    prenom: "Jean",
    signature_matin: "",
    signature_soir: "",
    code_session: "SESS001",
    date_du_cours: "15/01/2025",
    nom_formation: "Formation Test",
    nom_du_cours: "Cours Test"
  },
  intervenants: [
    {
      nom: "Martin",
      prenom: "Sophie",
      signature_matin: "",
      signature_soir: ""
    },
    {
      nom: "Bernard",
      prenom: "Pierre",
      signature_matin: "",
      signature_soir: ""
    }
  ]
};

async function testAPI() {
  try {
    console.log('🧪 Test de l\'API d\'émargement...\n');

    // Test 1: Vérification de la santé de l'API
    console.log('1. Test de santé de l\'API...');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✅ API opérationnelle:', healthResponse.data);
    console.log('');

    // Test 2: Génération d'un PDF de test
    console.log('2. Génération d\'un PDF de test...');
    const testResponse = await axios.post(`${API_URL}/api/test`, {}, {
      headers: {
        'x-api-key': API_KEY
      },
      responseType: 'arraybuffer'
    });
    
    fs.writeFileSync('test_emargement.pdf', testResponse.data);
    console.log('✅ PDF de test généré: test_emargement.pdf');
    console.log('');

    // Test 3: Génération avec données personnalisées
    console.log('3. Génération avec données personnalisées...');
    const customResponse = await axios.post(`${API_URL}/api/emargement`, testData, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });
    
    fs.writeFileSync('emargement_personnalise.pdf', customResponse.data);
    console.log('✅ PDF personnalisé généré: emargement_personnalise.pdf');
    console.log('');

    // Test 4: Test d'authentification (sans clé API)
    console.log('4. Test d\'authentification (sans clé API)...');
    try {
      await axios.post(`${API_URL}/api/emargement`, testData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Erreur: L\'authentification aurait dû échouer');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authentification correctement refusée');
      } else {
        console.log('❌ Erreur inattendue:', error.message);
      }
    }
    console.log('');

    // Test 5: Test de validation des données
    console.log('5. Test de validation des données...');
    const invalidData = {
      participant: {
        nom: "", // Nom vide
        prenom: "Jean",
        code_session: "SESS001",
        date_du_cours: "15/01/2025",
        nom_formation: "Formation Test",
        nom_du_cours: "Cours Test"
      },
      intervenants: []
    };

    try {
      await axios.post(`${API_URL}/api/emargement`, invalidData, {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Erreur: La validation aurait dû échouer');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation des données correctement appliquée');
      } else {
        console.log('❌ Erreur inattendue:', error.message);
      }
    }
    console.log('');

    console.log('🎉 Tous les tests sont terminés avec succès!');
    console.log('📁 Fichiers générés:');
    console.log('   - test_emargement.pdf');
    console.log('   - emargement_personnalise.pdf');
    console.log('');
    console.log('🔑 Clé API utilisée:', API_KEY);

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.data);
    }
  }
}

// Vérifier que le serveur est démarré
async function checkServer() {
  try {
    await axios.get(`${API_URL}/api/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Démarrage des tests de l\'API d\'émargement...\n');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Le serveur n\'est pas démarré. Veuillez lancer:');
    console.log('   npm start');
    console.log('');
    console.log('Puis relancer ce test.');
    return;
  }

  await testAPI();
}

main(); 