FROM node:18-alpine

# Installation des dépendances système
RUN apk add --no-cache git

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de configuration des dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste de l'application
COPY . .

# Exposition du port
EXPOSE 5173

# Configuration de Vite pour écouter sur toutes les interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
