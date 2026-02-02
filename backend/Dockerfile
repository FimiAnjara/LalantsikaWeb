
FROM php:8.3-fpm-bullseye


RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libpq-dev \
    zlib1g-dev \
    libssl-dev \
    libgrpc-dev \
    build-essential \
    autoconf \
    && rm -rf /var/lib/apt/lists/*


RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql


# Installation de gRPC
RUN pecl install grpc \
    && docker-php-ext-enable grpc


# Vérifier gRPC
RUN php -m | grep grpc


RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin \
    --filename=composer

WORKDIR /var/www/html