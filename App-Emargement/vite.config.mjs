import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Plugin de diagnostic pour Vite
const diagnosticPlugin = () => {
  return {
    name: 'vite-diagnostic',
    configResolved(config) {
      console.log('🔍 === VITE CONFIG DIAGNOSTIC ===');
      console.log('Répertoire courant:', process.cwd());
      console.log('Root:', config.root);
      console.log('Base:', config.base);
      console.log('OutDir:', config.build.outDir);
      console.log('AssetsDir:', config.build.assetsDir);
      console.log('Répertoire de sortie résolu:', path.resolve(process.cwd(), config.build.outDir));
    },
    writeBundle(options, bundle) {
      console.log('🔍 === BUILD COMPLETED ===');
      console.log('Options:', options);
      console.log('Bundle keys:', Object.keys(bundle));
      
      // Vérifier la structure après le build
      const outDir = path.resolve(process.cwd(), options.dir || '../dist');
      console.log('Dossier de sortie:', outDir);
      
      if (fs.existsSync(outDir)) {
        const files = fs.readdirSync(outDir);
        console.log('Fichiers générés:', files);
        
        // Vérifier index.html
        const indexPath = path.join(outDir, 'index.html');
        if (fs.existsSync(indexPath)) {
          console.log('✅ index.html trouvé');
          const content = fs.readFileSync(indexPath, 'utf8');
          console.log('Taille index.html:', content.length, 'caractères');
        } else {
          console.log('❌ index.html non trouvé');
        }
      } else {
        console.log('❌ Dossier de sortie non trouvé:', outDir);
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), diagnosticPlugin()],
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    assetsDir: 'assets'
  },
  base: '/',
  server: {
    port: 3001,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

