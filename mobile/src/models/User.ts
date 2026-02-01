/**
 * Types d'utilisateurs dans l'application
 * 1 = Utilisateur, 2 = Manager
 */
export enum UserType {
  UTILISATEUR = 1,
  MANAGER = 2
}

/**
 * Interface représentant un utilisateur dans Firestore
 */
export interface User {
  uid: string;
  id_utilisateur: number;
  email: string;
  identifiant: string;
  nom: string;
  prenom: string;
  dtn: string; // Date de naissance
  id_sexe: number; // 1 = Homme, 2 = Femme, etc.
  id_type_utilisateur: UserType;
  createdAt?: Date;
  updatedAt?: Date;
  last_sync_at?: string;
}

/**
 * Données pour créer un nouvel utilisateur
 */
export interface CreateUserData {
  email: string;
  identifiant: string;
  nom: string;
  prenom: string;
  dtn: string;
  id_sexe: number;
  id_type_utilisateur: UserType;
}

/**
 * Données retournées après une connexion réussie
 */
export interface LoginResponse {
  user: User;
  token: string;
}

/**
 * Obtenir le nom complet de l'utilisateur
 */
export const getFullName = (user: User): string => {
  return `${user.prenom} ${user.nom}`;
};

/**
 * Vérifier si l'utilisateur est un Manager
 */
export const isManager = (user: User): boolean => {
  return user.id_type_utilisateur === UserType.MANAGER;
};
