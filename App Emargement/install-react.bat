@echo off
echo ========================================
echo Installation de l'Application d'Emargement - Version React
echo ========================================
echo.

echo [1/5] Verification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installe.
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js detecte: 
node --version
echo.

echo [2/5] Installation des dependances backend...
npm install
if %errorlevel% neq 0 (
    echo ERREUR: Echec de l'installation des dependances backend
    pause
    exit /b 1
)
echo Dependances backend installees avec succes!
echo.

echo [3/5] Installation des dependances frontend React...
npm install react react-dom @types/react @types/react-dom
npm install vite @vitejs/plugin-react typescript @types/node
if %errorlevel% neq 0 (
    echo ERREUR: Echec de l'installation des dependances frontend
    pause
    exit /b 1
)
echo Dependances frontend installees avec succes!
echo.

echo [4/5] Configuration de l'environnement...
if not exist .env (
    copy config.env .env
    echo Fichier .env cree a partir de config.env
) else (
    echo Fichier .env existe deja
)
echo.

echo [5/5] Build de l'application React...
npm run build
if %errorlevel% neq 0 (
    echo ATTENTION: Le build a echoue. Verifiez la configuration.
) else (
    echo Build React reussi!
)
echo.

echo ========================================
echo Installation terminee!
echo ========================================
echo.
echo Pour demarrer l'application:
echo   Backend: npm start
echo   Frontend (dev): npm run dev:frontend
echo.
echo URLs:
echo   Backend API: http://localhost:3000
echo   Frontend React: http://localhost:3001
echo.
echo Pour tester l'API:
echo   node test-api.js
echo.
pause 