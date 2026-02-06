import { Sexe } from './Sexe';
import { TypeUtilisateur, TypeUtilisateurEnum } from './TypeUtilisateur';

/**
 * Interface représentant un utilisateur dans Firestore
 * Les relations (sexe, type_utilisateur) sont stockées en objets imbriqués
 */
export interface User {
  uid: string;
  id_utilisateur: number;
  email: string;
  identifiant: string;
  nom: string;
  prenom: string;
  dtn: string; // Date de naissance
  sexe: Sexe; // Objet imbriqué
  type_utilisateur: TypeUtilisateur; // Objet imbriqué
  photoUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  last_sync_at?: string | null;
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
  sexe: Sexe;
  type_utilisateur: TypeUtilisateur;
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
  return user.type_utilisateur.id_type_utilisateur === TypeUtilisateurEnum.MANAGER;
};

/**
 * Vérifier si l'utilisateur est un Utilisateur standard
 */
export const isUtilisateur = (user: User): boolean => {
  return user.type_utilisateur.id_type_utilisateur === TypeUtilisateurEnum.UTILISATEUR;
};
