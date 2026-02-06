import { Statut } from './Statut';
import { Point } from './Point';
import { Entreprise } from './Entreprise';

/**
 * Interface représentant l'utilisateur simplifié pour l'imbrication dans Signalement
 */
export interface UtilisateurRef {
  id_utilisateur?: number; // Peut être undefined si pas encore synchronisé avec PostgreSQL
  firebase_uid: string; // UID Firebase Auth (toujours présent)
  identifiant: string;
  nom: string;
  prenom: string;
}

/**
 * Interface représentant un signalement dans Firestore
 * Structure imbriquée pour éviter les jointures
 */
export interface Signalement {
  // Identifiants
  id_signalement?: number;
  firebase_id?: string; // ID Firestore généré automatiquement

  // Données principales
  daty: string; // Date de création au format ISO
  surface?: number; // Surface en m²
  budget?: number; // Budget estimé en MGA
  description?: string;
  photo?: string; // URL de la photo

  // Objets imbriqués (structure dénormalisée pour Firestore)
  point: Point;
  statut: Statut;
  utilisateur: UtilisateurRef;
  entreprise?: Entreprise;

  // Métadonnées pour la synchronisation
  last_sync_at?: string;
  synchronized: boolean;

  // Champs calculés/additionnels
  city?: string; // Ville (reverse geocoding)
  category?: string; // Catégorie du signalement
}

/**
 * Interface pour créer un nouveau signalement (champs utilisateur)
 * - point (latitude/longitude)
 * - description
 * - surface (optionnel)
 * - photos (optionnel - tableau de photos)
 * - daty (automatique)
 * - utilisateur (automatique)
 * 
 * Note: budget et entreprise sont remplis par le manager
 */
export interface CreateSignalementData {
  latitude: number;
  longitude: number;
  description: string;
  surface?: number;
  photo?: string; // Ancienne propriété pour compatibilité
  photos?: string[]; // Nouveau: tableau de photos (URLs ou base64)
  city?: string; // Nom de la ville/localité (reverse geocoding)
}

/**
 * Interface pour mettre à jour un signalement
 */
export interface UpdateSignalementData {
  description?: string;
  surface?: number;
  budget?: number;
  photo?: string;
  photos?: string[]; // Nouveau: tableau de photos
  id_statut?: number;
  id_entreprise?: number;
}

/**
 * Catégories de signalement disponibles
 */
export const SIGNALEMENT_CATEGORIES = [
  { value: 'route-endommagee', label: 'Route endommagée' },
  { value: 'nid-de-poule', label: 'Nid de poule' },
  { value: 'travaux', label: 'Travaux en cours' },
  { value: 'accident', label: 'Accident' },
  { value: 'inondation', label: 'Inondation' },
  { value: 'obstacle', label: 'Obstacle sur la route' },
  { value: 'autre', label: 'Autre' }
];

/**
 * Obtenir le label d'une catégorie
 */
export const getCategoryLabel = (value: string): string => {
  const category = SIGNALEMENT_CATEGORIES.find(c => c.value === value);
  return category?.label || value;
};

/**
 * Formater la date pour l'affichage
 */
export const formatSignalementDate = (daty: string): string => {
  const date = new Date(daty);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formater le budget pour l'affichage
 */
export const formatBudget = (budget?: number): string => {
  if (!budget) return 'Non défini';
  return new Intl.NumberFormat('fr-MG', {
    style: 'currency',
    currency: 'MGA',
    minimumFractionDigits: 0
  }).format(budget);
};

/**
 * Formater la surface pour l'affichage
 */
export const formatSurface = (surface?: number): string => {
  if (!surface) return 'Non définie';
  return `${surface.toLocaleString('fr-FR')} m²`;
};
