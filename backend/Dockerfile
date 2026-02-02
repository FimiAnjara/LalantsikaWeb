
FROM php:8.2-fpm-bullseye


RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libpq-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*


RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql


# Installation de gRPC via version pré-compilée (plus rapide et stable)
# RUN pecl install grpc-1.57.0 \
#     && docker-php-ext-enable grpc

RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin \
    --filename=composer

WORKDIR /var/www/html