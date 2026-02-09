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

# Configuration des permissions pour les logs
echo "🔒 Configuration des permissions..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Migration de la base de données
echo "🗄️ Exécution des migrations..."
if [ "${DB_MIGRATE_FRESH:-false}" = "true" ]; then
    echo "⚠️  Mode FRESH: Suppression et recréation des tables..."
    php artisan migrate:fresh --force
else
    echo "📊 Migrations incrémentales..."
    php artisan migrate --force
fi

# Exécution des seeders
if [ "${DB_SEED:-true}" = "true" ]; then
    echo "🌱 Exécution des seeders..."
    php artisan db:seed --force
    echo "✅ Seeders terminés"
else
    echo "⏭️  Seeders ignorés (DB_SEED=false)"
fi

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