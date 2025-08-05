#!/bin/bash

# Script de synchronisation pour la branche LYO
# Synchronise avec la branche main et redémarre l'application

echo "🔄 Début de la synchronisation de la branche LYO..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

# Sauvegarder les modifications locales si elles existent
if ! git diff-index --quiet HEAD --; then
    echo "📝 Sauvegarde des modifications locales..."
    git stash push -m "Sauvegarde avant synchronisation LYO"
    STASH_CREATED=true
fi

# Basculer sur la branche main
echo "🔄 Basculement sur la branche main..."
git checkout main

# Synchroniser avec le repository distant
echo "🔄 Synchronisation avec origin/main..."
git pull origin main

# Vérifier si la branche LYO existe
if git show-ref --verify --quiet refs/heads/LYO; then
    echo "🔄 Basculement sur la branche LYO existante..."
    git checkout LYO
    echo "🔄 Fusion des changements de main dans LYO..."
    git merge main
else
    echo "🔄 Création de la nouvelle branche LYO..."
    git checkout -b LYO
fi

# Restaurer les modifications locales si elles existaient
if [ "$STASH_CREATED" = true ]; then
    echo "📝 Restauration des modifications locales..."
    git stash pop
fi

# Installer les dépendances si nécessaire
echo "📦 Vérification des dépendances..."
npm install

# Arrêter le serveur de développement s'il tourne
echo "🛑 Arrêt du serveur de développement..."
pkill -f "vite" || true
pkill -f "node.*vite" || true

# Attendre que les processus se terminent
sleep 2

# Redémarrer l'application
echo "🚀 Redémarrage de l'application sur le port 8080..."
npm run dev &

# Attendre que l'application démarre
echo "⏳ Attente du démarrage de l'application..."
sleep 8

# Vérifier que l'application fonctionne
echo "🔍 Vérification du statut de l'application..."
for i in {1..5}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|304"; then
        echo "✅ Synchronisation réussie !"
        echo "🌐 Application accessible sur: http://localhost:8080"
        echo "📋 Branche actuelle: $(git branch --show-current)"
        echo "📊 Statut Git:"
        git status --porcelain
        exit 0
    else
        echo "⏳ Tentative $i/5 - Attente du démarrage..."
        sleep 3
    fi
done

echo "❌ Erreur lors du démarrage de l'application"
echo "🔍 Vérification des logs..."
ps aux | grep vite
exit 1