
FROM php:8.2-fpm-bullseye


RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*


RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql


# Ilaina @ liaison firebase
# RUN pecl install grpc \
#     && docker-php-ext-enable grpc


RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin \
    --filename=composer

WORKDIR /var/www/html