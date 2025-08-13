const fs = require('fs');
const path = require('path');

console.log('🔍 === POST-BUILD DIAGNOSTIC ===');
console.log('Timestamp:', new Date().toISOString());

// Vérifier la structure après le build
console.log('\n📁 === STRUCTURE APRÈS BUILD ===');
const currentDir = process.cwd();
const parentDir = path.dirname(currentDir);
const rootDir = path.dirname(parentDir);

console.log('Dossier courant:', currentDir);
console.log('Dossier parent:', parentDir);
console.log('Dossier racine:', rootDir);

// Lister tous les dossiers et fichiers importants
const importantPaths = [
  'dist',
  '../dist',
  '../../dist',
  'src',
  'public',
  'node_modules',
  'package.json',
  'vite.config.mjs',
  'vercel.json'
];

console.log('\n📋 === CONTENU DES DOSSIERS ===');
importantPaths.forEach(item => {
  const fullPath = path.resolve(currentDir, item);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      try {
        const files = fs.readdirSync(fullPath);
        console.log(`📁 ${item}/ (${files.length} éléments):`, files.slice(0, 10));
        if (files.length > 10) {
          console.log(`   ... et ${files.length - 10} autres fichiers`);
        }
      } catch (error) {
        console.log(`❌ Erreur lecture ${item}:`, error.message);
      }
    } else {
      console.log(`📄 ${item} (${stats.size} bytes)`);
    }
  } else {
    console.log(`❌ ${item} non trouvé`);
  }
});

// Vérifier spécifiquement le dossier dist
console.log('\n🏗️ === ANALYSE DU DOSSIER DIST ===');
const distPaths = ['dist', '../dist', '../../dist'];
distPaths.forEach(distPath => {
  const fullPath = path.resolve(currentDir, distPath);
  if (fs.existsSync(fullPath)) {
    console.log(`\n📂 ${distPath} trouvé:`, fullPath);
    
    try {
      const files = fs.readdirSync(fullPath);
      console.log(`Contenu:`, files);
      
      // Vérifier index.html
      const indexPath = path.join(fullPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`✅ index.html trouvé dans ${distPath}`);
        const content = fs.readFileSync(indexPath, 'utf8');
        console.log(`Taille: ${content.length} caractères`);
        
        // Analyser le contenu HTML
        const hasRootDiv = content.includes('<div id="root">');
        const hasScript = content.includes('<script');
        const hasAssets = content.includes('/assets/');
        
        console.log(`Contient div#root: ${hasRootDiv}`);
        console.log(`Contient script: ${hasScript}`);
        console.log(`Contient /assets/: ${hasAssets}`);
        
        // Extraire les chemins des assets
        const assetMatches = content.match(/src="([^"]+)"/g);
        if (assetMatches) {
          console.log('Assets référencés:', assetMatches);
        }
      } else {
        console.log(`❌ index.html non trouvé dans ${distPath}`);
      }
      
      // Vérifier le dossier assets
      const assetsPath = path.join(fullPath, 'assets');
      if (fs.existsSync(assetsPath)) {
        const assetFiles = fs.readdirSync(assetsPath);
        console.log(`Assets:`, assetFiles);
        
        // Vérifier la taille des assets
        assetFiles.forEach(file => {
          const filePath = path.join(assetsPath, file);
          const stats = fs.statSync(filePath);
          console.log(`  ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
        });
      } else {
        console.log(`❌ Dossier assets non trouvé dans ${distPath}`);
      }
    } catch (error) {
      console.log(`❌ Erreur lecture ${distPath}:`, error.message);
    }
  } else {
    console.log(`❌ ${distPath} non trouvé:`, fullPath);
  }
});

// Vérifier la configuration Vite actuelle
console.log('\n⚡ === CONFIGURATION VITE ACTUELLE ===');
const viteConfigPath = path.resolve(currentDir, 'vite.config.mjs');
if (fs.existsSync(viteConfigPath)) {
  try {
    const content = fs.readFileSync(viteConfigPath, 'utf8');
    console.log('Contenu actuel de vite.config.mjs:');
    console.log(content);
  } catch (error) {
    console.log('❌ Erreur lecture vite.config.mjs:', error.message);
  }
}

console.log('\n✅ === POST-BUILD DIAGNOSTIC TERMINÉ ===');
