const fs = require('fs');
const path = require('path');

console.log('🔍 === DIAGNOSTIC BUILD TEST ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Répertoire courant:', process.cwd());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

// Test 1: Vérifier la structure du projet
console.log('\n📁 === STRUCTURE DU PROJET ===');
const currentDir = process.cwd();
const parentDir = path.dirname(currentDir);
const rootDir = path.dirname(parentDir);

console.log('Dossier courant:', currentDir);
console.log('Dossier parent:', parentDir);
console.log('Dossier racine:', rootDir);

// Test 2: Vérifier les fichiers de configuration
console.log('\n⚙️ === FICHIERS DE CONFIGURATION ===');
const configFiles = [
  'package.json',
  'vite.config.mjs',
  'vercel.json',
  '../vercel.json',
  '../../vercel.json'
];

configFiles.forEach(file => {
  const fullPath = path.resolve(currentDir, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} trouvé:`, fullPath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      console.log(`   Taille: ${content.length} caractères, ${lines} lignes`);
    } catch (error) {
      console.log(`   ❌ Erreur lecture:`, error.message);
    }
  } else {
    console.log(`❌ ${file} non trouvé:`, fullPath);
  }
});

// Test 3: Vérifier les dossiers de build potentiels
console.log('\n🏗️ === DOSSIERS DE BUILD ===');
const buildDirs = [
  'dist',
  '../dist',
  '../../dist',
  'build',
  '../build',
  '../../build'
];

buildDirs.forEach(dir => {
  const fullPath = path.resolve(currentDir, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${dir} trouvé:`, fullPath);
    try {
      const files = fs.readdirSync(fullPath);
      console.log(`   Contenu:`, files);
      
      // Vérifier index.html
      const indexPath = path.join(fullPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`   ✅ index.html trouvé dans ${dir}`);
        const content = fs.readFileSync(indexPath, 'utf8');
        console.log(`   Taille index.html: ${content.length} caractères`);
        
        // Vérifier les assets
        const assetsPath = path.join(fullPath, 'assets');
        if (fs.existsSync(assetsPath)) {
          const assetFiles = fs.readdirSync(assetsPath);
          console.log(`   Assets:`, assetFiles);
        }
      } else {
        console.log(`   ❌ index.html non trouvé dans ${dir}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur lecture:`, error.message);
    }
  } else {
    console.log(`❌ ${dir} non trouvé:`, fullPath);
  }
});

// Test 4: Vérifier la configuration Vite
console.log('\n⚡ === CONFIGURATION VITE ===');
const viteConfigPath = path.resolve(currentDir, 'vite.config.mjs');
if (fs.existsSync(viteConfigPath)) {
  try {
    const content = fs.readFileSync(viteConfigPath, 'utf8');
    console.log('Contenu vite.config.mjs:');
    console.log(content);
    
    // Extraire outDir
    const outDirMatch = content.match(/outDir:\s*['"`]([^'"`]+)['"`]/);
    if (outDirMatch) {
      console.log('📂 outDir détecté:', outDirMatch[1]);
      const resolvedOutDir = path.resolve(currentDir, outDirMatch[1]);
      console.log('📂 outDir résolu:', resolvedOutDir);
    } else {
      console.log('❌ outDir non trouvé dans la configuration');
    }
  } catch (error) {
    console.log('❌ Erreur lecture vite.config.mjs:', error.message);
  }
}

// Test 5: Vérifier les variables d'environnement
console.log('\n🌍 === VARIABLES D\'ENVIRONNEMENT ===');
const envVars = ['NODE_ENV', 'VERCEL', 'VERCEL_ENV', 'VERCEL_URL'];
envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`${varName}: ${value}`);
  } else {
    console.log(`${varName}: non définie`);
  }
});

console.log('\n✅ === DIAGNOSTIC TERMINÉ ===');
