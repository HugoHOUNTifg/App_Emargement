/**
 * ==========================================
 * APPLICATION D'ÉMARGEMENT - SERVEUR PRINCIPAL
 * ==========================================
 * 
 * Ce serveur Express.js génère des feuilles d'émargement au format PDF
 * à partir de données JSON. Il inclut :
 * 
 * - Authentification par clé API
 * - Validation des données d'entrée
 * - Génération de PDF avec PDFKit
 * - Téléchargement d'images de signature depuis des URLs externes
 * - Interface web React intégrée
 * - Sécurité avec Helmet.js et rate limiting
 * 
 * MODIFICATIONS RÉCENTES (2025) :
 * - Ajout du téléchargement d'images de signature depuis des URLs externes
 * - Configuration CORS élargie pour permettre les accès réseau
 * - Gestion d'erreurs améliorée pour les téléchargements d'images
 * - Support des signatures pour les participants et intervenants
 * 
 * ==========================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const PDFDocument = require('pdfkit');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
// Pour Vercel, on n'a pas besoin de HOST car c'est géré automatiquement
const HOST = process.env.HOST || '0.0.0.0';

// Journalisation des erreurs globales (pour voir tous les bugs dans la console)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Configuration de sécurité
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes par défaut
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limite par IP
  message: {
    error: 'Trop de requêtes',
    message: 'Veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de sécurité - CSP désactivé en développement
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "http://localhost:3000", "https://localhost:3000", "http://localhost:3001", "https://localhost:3001"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
} else {
  // En développement, utiliser helmet sans CSP restrictif
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  // Logger HTTP verbeux en dev
  app.use(morgan('dev'));
}

/**
 * Configuration CORS élargie pour permettre les accès réseau
 * 
 * Cette configuration permet :
 * - Toutes les origines (*) pour le développement
 * - Les méthodes GET, POST, OPTIONS
 * - Les en-têtes Content-Type, x-api-key, Authorization
 * 
 * ATTENTION : En production, restreindre l'origine à des domaines spécifiques
 */
app.use(cors({
  origin: '*', // Permettre toutes les origines
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', limiter);

// Servir les fichiers statiques React (dist se trouve un niveau au-dessus de api/)
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Clé API pour sécuriser l'accès
const API_KEY = process.env.API_KEY || 'IFG_EMARGEMENT_2025_SECURE_KEY';

// Validation des données
const validateParticipant = (participant) => {
  const required = ['nom', 'prenom', 'code_session', 'date_du_cours', 'nom_formation', 'nom_du_cours'];
  const missing = required.filter(field => !participant[field] || participant[field].trim() === '');
  
  if (missing.length > 0) {
    throw new Error(`Champs manquants: ${missing.join(', ')}`);
  }

  // Validation de la date
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(participant.date_du_cours)) {
    throw new Error('Format de date invalide. Utilisez JJ/MM/AAAA');
  }

  // Validation des signatures (optionnelles) - URLs ou base64
  if (participant.signature_matin && !isValidImageData(participant.signature_matin)) {
    throw new Error('Format de signature matin invalide (URL ou base64 requis)');
  }
  if (participant.signature_soir && !isValidImageData(participant.signature_soir)) {
    throw new Error('Format de signature soir invalide (URL ou base64 requis)');
  }

  return true;
};

const validateIntervenants = (intervenants) => {
  if (!Array.isArray(intervenants)) {
    throw new Error('Les intervenants doivent être un tableau');
  }

  if (intervenants.length > 50) {
    throw new Error('Trop d\'intervenants (maximum 50)');
  }

  intervenants.forEach((intervenant, index) => {
    if (!intervenant.nom || !intervenant.prenom) {
      throw new Error(`Intervenant ${index + 1}: nom et prénom requis`);
    }

    if (intervenant.signature_matin && !isValidImageData(intervenant.signature_matin)) {
      throw new Error(`Intervenant ${index + 1}: format de signature matin invalide (URL ou base64 requis)`);
    }
    if (intervenant.signature_soir && !isValidImageData(intervenant.signature_soir)) {
      throw new Error(`Intervenant ${index + 1}: format de signature soir invalide (URL ou base64 requis)`);
    }
  });

  return true;
};

/**
 * Validation des URLs (pour compatibilité)
 */
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

/**
 * Validation des données d'image (URLs ou base64)
 * 
 * Cette fonction valide :
 * - URLs HTTP/HTTPS (PNG, JPEG, SVG)
 * - Données base64 avec préfixe data:image/ (PNG, JPEG, SVG)
 * - Données base64 pures (longueur > 100 caractères)
 * 
 * @param {string} imageData - Données d'image à valider
 * @returns {boolean} - True si le format est valide
 */
const isValidImageData = (imageData) => {
  // URLs HTTP/HTTPS
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    return isValidUrl(imageData);
  }
  
  // Base64 avec préfixe data:image/
  if (imageData.startsWith('data:image/')) {
    const parts = imageData.split(',');
    if (parts.length !== 2 || !parts[1]) {
      return false;
    }
    
    // Vérifier le type MIME (PNG, JPEG, SVG)
    const mimeType = imageData.split(';')[0].split(':')[1];
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    return supportedTypes.includes(mimeType);
  }
  
  // Base64 pur (longueur > 100 et pas d'espaces)
  if (imageData.length > 100 && !imageData.includes(' ')) {
    try {
      // Test de décodage base64
      Buffer.from(imageData, 'base64');
      return true;
    } catch (_) {
      return false;
    }
  }
  
  return false;
};

/**
 * Fonction pour récupérer les images de signature depuis différentes sources
 * 
 * Cette fonction supporte :
 * - URLs HTTP/HTTPS (PNG, JPEG, SVG)
 * - Données base64 (PNG, JPEG, SVG)
 * - Gestion des timeouts (10 secondes pour les URLs)
 * - User-Agent personnalisé pour éviter les blocages
 * - Retourne null en cas d'erreur (pour afficher un placeholder)
 * 
 * @param {string} imageData - URL ou données base64 de l'image
 * @returns {Buffer|null} - Buffer de l'image ou null si erreur
 */
async function getImageData(imageData) {
  // Si c'est une URL (commence par http:// ou https://)
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    try {
      const axios = require('axios');
      const response = await axios.get(imageData, {
        responseType: 'arraybuffer',
        timeout: 15000, // 15 secondes de timeout (augmenté)
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Accepter seulement les codes 2xx
        }
      });
      return response.data;
    } catch (error) {
      console.warn(`Impossible de télécharger l'image depuis l'URL: ${imageData}`, error.message);
      // Retourner null pour afficher un placeholder au lieu de faire échouer le PDF
      return null;
    }
  }
  
  // Si c'est du base64
  if (imageData.startsWith('data:image/')) {
    try {
      // Extraire les données base64
      const base64Data = imageData.split(',')[1];
      if (!base64Data) {
        console.warn('Format base64 invalide: données manquantes');
        return null;
      }
      
      // Convertir base64 en Buffer
      const buffer = Buffer.from(base64Data, 'base64');
      return buffer;
    } catch (error) {
      console.warn('Erreur lors du décodage base64:', error.message);
      return null;
    }
  }
  
  // Si c'est du base64 pur (sans préfixe data:)
  if (imageData.length > 100 && !imageData.includes(' ')) {
    try {
      // Essayer de décoder comme base64 pur
      const buffer = Buffer.from(imageData, 'base64');
      return buffer;
    } catch (error) {
      console.warn('Format base64 invalide:', error.message);
      return null;
    }
  }
  
  console.warn('Format d\'image non reconnu:', imageData.substring(0, 50) + '...');
  return null;
}

// Middleware de vérification de la clé API
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ 
      error: 'Clé API invalide ou manquante',
      message: 'Veuillez fournir une clé API valide dans les en-têtes'
    });
  }
  
  next();
};

/**
 * Fonction principale pour générer la feuille d'émargement au format PDF
 * 
 * Cette fonction :
 * - Crée un document PDF avec PDFKit
 * - Inclut les informations de formation
 * - Génère un tableau des participants et intervenants
 * - Télécharge et insère les images de signature depuis des URLs
 * - Gère les erreurs de téléchargement avec des placeholders
 * 
 * @param {Object} data - Données contenant participant et intervenants
 * @returns {Promise<Buffer>} - Buffer du PDF généré
 */
async function generateEmargementPDF(data) {
  // Rendu HTML avec EJS + conversion PDF via Puppeteer
  const templatePath = path.join(__dirname, 'templates', 'emargement.ejs');

  // Préparer les logos en data URI pour éviter les soucis de chemins
  const logosBase = path.join(__dirname, 'logos');
  const toDataUri = (absPath, mime) => {
    try {
      const buf = fs.readFileSync(absPath);
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch (e) {
      console.warn('Logo introuvable:', absPath, e.message);
      return '';
    }
  };
  const logos = {
    ifg: toDataUri(path.join(logosBase, 'ifg.webp'), 'image/webp'),
    omnes: toDataUri(path.join(logosBase, 'Logo_Omnes_Éducation.svg.png'), 'image/png'),
    fonds: toDataUri(path.join(logosBase, 'logo_fond_paritaire.jpg'), 'image/jpeg'),
    fse: toDataUri(path.join(logosBase, 'Logo-LEurope-sengage-en-France-FSE.png'), 'image/png'),
  };

  const html = await ejs.renderFile(templatePath, { data, logos }, { async: true });

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  await browser.close();
  return pdfBuffer;
}

// Route principale pour générer l'émargement
app.post('/api/emargement', verifyApiKey, async (req, res) => {
  try {
    const { participant, intervenants } = req.body;

    // Validation des données
    try {
      validateParticipant(participant);
      validateIntervenants(intervenants || []);
    } catch (validationError) {
      return res.status(400).json({
        error: 'Données invalides',
        message: validationError.message
      });
    }

    const data = {
      participant,
      intervenants: intervenants || []
    };

    // Génération du PDF
    const pdfBuffer = await generateEmargementPDF(data);

    // Envoi du PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="emargement.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de générer la feuille d\'émargement'
    });
  }
});

// Route de test pour vérifier que l'API fonctionne
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API d\'émargement opérationnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Route pour tester la génération avec des données d'exemple
app.post('/api/test', verifyApiKey, async (req, res) => {
  try {
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
        }
      ]
    };

    const pdfBuffer = await generateEmargementPDF(testData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test_emargement.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erreur lors du test:', error);
    res.status(500).json({
      error: 'Erreur lors du test',
      message: error.message
    });
  }
});

// Route pour l'interface web React
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Fallback pour les routes React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: isDev ? err.message : 'Une erreur inattendue s\'est produite',
    stack: isDev ? err.stack : undefined
  });
});

// En environnement serverless (Vercel), pas d'écoute de port
if (process.env.VERCEL !== '1') {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Serveur démarré sur ${HOST}:${PORT}`);
    console.log(`📋 API d'émargement disponible sur http://localhost:${PORT}`);
    console.log(`🔑 Clé API: ${API_KEY}`);
    console.log(`🔒 Mode sécurité: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Développement'}`);
  });
}

module.exports = app; 