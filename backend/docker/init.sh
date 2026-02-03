#!/bin/bash

# Script d'initialisation pour Laravel

echo "🚀 Initialisation de l'application Laravel..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ Base de données disponible"

# Installation des dépendances Composer
if [ ! -d "vendor" ]; then
    echo "📦 Installation des dépendances Composer..."
    composer install --no-dev --optimize-autoloader
fi

# Génération de la clé d'application si nécessaire
if [ ! -f ".env" ]; then
    echo "📄 Copie du fichier de configuration..."
    cp .env.example .env
fi

echo "🔑 Génération de la clé d'application..."
php artisan key:generate --force

# Migration de la base de données
echo "🗄️ Migration de la base de données..."
php artisan migrate:fresh --seed --force

# Génération de la documentation Swagger
echo "📚 Génération de la documentation API..."
php artisan l5-swagger:generate

# Optimisation pour la production
echo "⚡ Optimisation de l'application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "✅ Initialisation terminée !"

# Démarrage du serveur PHP-FPM
php-fpm