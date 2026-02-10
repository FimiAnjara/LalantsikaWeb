# ============ Stage 1 : Build ============
FROM node:18-alpine AS build

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm ci

# Copie du reste de l'application
COPY . .

# Variables d'environnement pour le build (peuvent être surchargées via docker-compose)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Build de production
RUN npm run build

# ============ Stage 2 : Serve avec Nginx ============
FROM nginx:1.25-alpine

# Copie du build dans le dossier Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copie de la config Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
