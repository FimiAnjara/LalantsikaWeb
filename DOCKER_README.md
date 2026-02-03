# LalantsikaWeb - Déployment Docker

Ce projet utilise Docker Compose pour orchestrer tous les services nécessaires au fonctionnement de l'application.

## 🐳 Architecture des Services

- **postgres** : Base de données PostgreSQL avec extension PostGIS (port 5432)
- **backend** : API Laravel avec PHP-FPM (accessible via nginx)
- **nginx** : Serveur web pour l'API Laravel (port 8000)
- **frontend** : Application React/Vite (port 5173)
- **tileserver** : Serveur de cartes TileServer GL (port 8088)

## 🚀 Démarrage Rapide

### Prérequis
- Docker
- Docker Compose

### Lancement de tous les services
```bash
docker compose up -d
```

### Arrêt de tous les services
```bash
docker compose down
```

### Arrêt complet avec suppression des volumes
```bash
docker compose down -v
```

## 📋 Accès aux Services

- **Frontend** : http://localhost:5173
- **API Backend** : http://localhost:8000
- **Documentation API** : http://localhost:8000/api/documentation
- **TileServer** : http://localhost:8088

## 🔧 Commandes Utiles

### Voir les logs
```bash
# Tous les services
docker compose logs -f

# Service spécifique
docker compose logs -f backend
docker compose logs -f frontend
```

### Reconstruction des images
```bash
# Reconstruire tous les services
docker compose build

# Reconstruire un service spécifique
docker compose build backend
```

### Accès aux conteneurs
```bash
# Backend Laravel
docker compose exec backend bash

# Base de données
docker compose exec postgres psql -U laravel -d laravel

# Frontend
docker compose exec frontend sh
```

### Gestion de Laravel
```bash
# Migration de la base de données
docker compose exec backend php artisan migrate

# Seeder
docker compose exec backend php artisan db:seed

# Génération de la documentation API
docker compose exec backend php artisan l5-swagger:generate
```

## 🛠️ Développement

### Rechargement à chaud
- Le frontend (React/Vite) supporte le rechargement à chaud
- Le backend Laravel utilise des volumes pour refléter les changements de code

### Variables d'environnement
Les variables d'environnement sont configurées dans le docker-compose.yml et peuvent être personnalisées selon vos besoins.

## 🐛 Dépannage

### Problèmes de base de données
```bash
# Vérifier le statut de PostgreSQL
docker compose exec postgres pg_isready -U laravel

# Accéder à la console PostgreSQL
docker compose exec postgres psql -U laravel -d laravel
```

### Problèmes de permissions Laravel
```bash
# Corriger les permissions
docker compose exec backend chown -R www-data:www-data /var/www/html/storage
docker compose exec backend chmod -R 755 /var/www/html/storage
```

### Recréation complète
```bash
# Arrêter et supprimer tout
docker compose down -v --remove-orphans

# Supprimer les images
docker compose down --rmi all

# Redémarrer
docker compose up -d --build
```

## 📊 État des Services

Pour vérifier l'état de tous les services :
```bash
docker compose ps
```

La configuration est optimisée pour le développement avec des volumes montés pour permettre le rechargement à chaud et la persistance des données.