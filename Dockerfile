
FROM php:8.2-fpm

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libpq-dev \
    zlib1g-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Installation des extensions PHP
RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql

# Installation de Composer
RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin \
    --filename=composer && \
    chmod +x /usr/local/bin/composer

# Définition du répertoire de travail
WORKDIR /var/www/html

# Copie des fichiers de configuration
COPY composer.json composer.lock ./

# Installation des dépendances Composer (sans dev)
RUN composer install --no-dev --no-scripts --no-autoloader && \
    composer dump-autoload --optimize

# Copie de tous les fichiers de l'application
COPY . .

# Copie et rendre exécutable le script d'initialisation
COPY docker/init.sh /usr/local/bin/init.sh
RUN chmod +x /usr/local/bin/init.sh

# Configuration des permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html/storage && \
    chmod -R 755 /var/www/html/bootstrap/cache

# Exposition du port
EXPOSE 9000

# Commande de démarrage
CMD ["/usr/local/bin/init.sh"]