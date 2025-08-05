#!/bin/bash

# Script de lancement de l'application lovable.dev sur le port 8080
# Branche LYO-new

echo "🚀 Lancement de l'application lovable.dev sur le port 8080..."
echo "📁 Branche: LYO-new"
echo "🌐 URL: http://localhost:8080"
echo ""

# Vérifier que nous sommes dans la bonne branche
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "LYO-new" ]; then
    echo "⚠️  Attention: Vous n'êtes pas sur la branche LYO-new"
    echo "   Branche actuelle: $CURRENT_BRANCH"
    echo "   Utilisez: git checkout LYO-new"
    echo ""
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo ""
fi

# Lancer l'application
echo "🎯 Démarrage du serveur de développement..."
echo "   Port: 8080"
echo "   Mode: Development"
echo ""

npm run dev