const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', limiter);

// Servir les fichiers statiques React
app.use(express.static('dist'));

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

  // Validation des URLs de signature (optionnelles)
  if (participant.signature_matin && !isValidUrl(participant.signature_matin)) {
    throw new Error('URL de signature matin invalide');
  }
  if (participant.signature_soir && !isValidUrl(participant.signature_soir)) {
    throw new Error('URL de signature soir invalide');
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

    if (intervenant.signature_matin && !isValidUrl(intervenant.signature_matin)) {
      throw new Error(`Intervenant ${index + 1}: URL de signature matin invalide`);
    }
    if (intervenant.signature_soir && !isValidUrl(intervenant.signature_soir)) {
      throw new Error(`Intervenant ${index + 1}: URL de signature soir invalide`);
    }
  });

  return true;
};

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

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

// Fonction pour générer la feuille d'émargement
function generateEmargementPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // En-tête
      doc.fontSize(20).font('Helvetica-Bold').text('FEUILLE D\'ÉMARGEMENT', { align: 'center' });
      doc.moveDown(0.5);
      
      // Informations de la formation
      doc.fontSize(12).font('Helvetica-Bold').text('FORMATION:', 50, 100);
      doc.fontSize(12).font('Helvetica').text(data.participant.nom_formation, 150, 100);
      doc.moveDown(0.5);
      
      doc.fontSize(12).font('Helvetica-Bold').text('COURS:', 50);
      doc.fontSize(12).font('Helvetica').text(data.participant.nom_du_cours);
      doc.moveDown(0.5);
      
      doc.fontSize(12).font('Helvetica-Bold').text('DATE:', 50);
      doc.fontSize(12).font('Helvetica').text(data.participant.date_du_cours);
      doc.moveDown(0.5);
      
      doc.fontSize(12).font('Helvetica-Bold').text('CODE SESSION:', 50);
      doc.fontSize(12).font('Helvetica').text(data.participant.code_session);
      doc.moveDown(1);

      // Tableau des participants
      doc.fontSize(14).font('Helvetica-Bold').text('PARTICIPANTS', { align: 'center' });
      doc.moveDown(0.5);

      // En-têtes du tableau
      const startY = doc.y;
      const colWidth = 100;
      const rowHeight = 30;
      
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Nom', 50, startY);
      doc.text('Prénom', 150, startY);
      doc.text('Signature Matin', 250, startY);
      doc.text('Signature Soir', 350, startY);
      
      // Ligne de séparation
      doc.moveTo(50, startY + 20).lineTo(450, startY + 20).stroke();
      
      // Participant principal
      let currentY = startY + 25;
      doc.fontSize(10).font('Helvetica');
      doc.text(data.participant.nom, 50, currentY);
      doc.text(data.participant.prenom, 150, currentY);
      
      // Placeholder pour les signatures
      doc.rect(250, currentY - 5, 80, 20).stroke();
      doc.rect(350, currentY - 5, 80, 20).stroke();
      
      // Intervenants
      if (data.intervenants && data.intervenants.length > 0) {
        data.intervenants.forEach((intervenant, index) => {
          currentY += rowHeight;
          doc.text(intervenant.nom, 50, currentY);
          doc.text(intervenant.prenom, 150, currentY);
          
          // Placeholder pour les signatures
          doc.rect(250, currentY - 5, 80, 20).stroke();
          doc.rect(350, currentY - 5, 80, 20).stroke();
        });
      }

      // Pied de page
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica').text('Document généré automatiquement', { align: 'center' });
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
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
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Fallback pour les routes React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: 'Une erreur inattendue s\'est produite'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📋 API d'émargement disponible sur http://localhost:${PORT}`);
  console.log(`🔑 Clé API: ${API_KEY}`);
  console.log(`🔒 Mode sécurité: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Développement'}`);
});

module.exports = app; 