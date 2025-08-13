@echo off
echo ========================================
echo Installation de l'Application d'Emargement
echo ========================================
echo.

echo [1/4] Verification de Node.js...
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

echo [2/4] Installation des dependances...
npm install
if %errorlevel% neq 0 (
    echo ERREUR: Echec de l'installation des dependances
    pause
    exit /b 1
)
echo Dependances installees avec succes!
echo.

echo [3/4] Configuration de l'environnement...
if not exist .env (
    copy config.env .env
    echo Fichier .env cree a partir de config.env
) else (
    echo Fichier .env existe deja
)
echo.

echo [4/4] Test de l'application...
echo Demarrage du serveur en arriere-plan...
start /B npm start
timeout /t 3 /nobreak >nul

echo Test de l'API...
node test-api.js
if %errorlevel% neq 0 (
    echo ATTENTION: Les tests ont echoue. Verifiez la configuration.
) else (
    echo Tests reussis!
)
echo.

echo ========================================
echo Installation terminee!
echo ========================================
echo.
echo Pour demarrer l'application:
echo   npm start
echo.
echo Pour tester l'API:
echo   node test-api.js
echo.
echo URL de l'API: http://localhost:3000
echo.
pause 