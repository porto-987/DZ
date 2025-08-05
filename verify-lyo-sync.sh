#!/bin/bash

# Script de vérification de la synchronisation LYO
# Vérifie que l'application lovable.dev fonctionne correctement

echo "🔍 Vérification de la synchronisation LYO..."

# Vérifier la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Branche actuelle: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "LYO" ]; then
    echo "⚠️  Attention: Vous n'êtes pas sur la branche LYO"
    echo "🔄 Basculement sur la branche LYO..."
    git checkout LYO
fi

# Vérifier le statut Git
echo "📊 Statut Git:"
git status --porcelain

# Vérifier la synchronisation avec le remote
echo "🔄 Vérification de la synchronisation avec origin/LYO..."
git fetch origin
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/LYO)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "✅ Synchronisation avec origin/LYO: OK"
else
    echo "⚠️  Synchronisation avec origin/LYO: DIFFÉRENTE"
fi

# Vérifier que l'application fonctionne
echo "🌐 Test de l'application sur http://localhost:8080..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Application accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Application non accessible (HTTP $HTTP_CODE)"
    echo "🔄 Tentative de redémarrage..."
    pkill -f "vite" || true
    sleep 2
    npm run dev &
    sleep 8
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Application redémarrée avec succès"
    else
        echo "❌ Échec du redémarrage"
        exit 1
    fi
fi

# Vérifier les processus en cours
echo "📊 Processus en cours:"
ps aux | grep -E "(vite|node)" | grep -v grep || echo "Aucun processus trouvé"

# Afficher les informations de l'application
echo ""
echo "🎉 Vérification terminée !"
echo "📋 Résumé:"
echo "   - Branche: $CURRENT_BRANCH"
echo "   - Application: http://localhost:8080"
echo "   - Statut: Opérationnel"
echo ""
echo "🚀 Commandes utiles:"
echo "   - Arrêter l'app: pkill -f vite"
echo "   - Redémarrer: npm run dev"
echo "   - Synchronisation: ./sync-lyo-branch.sh"
echo "   - Logs: tail -f /dev/null"