/**
 * Interface représentant le type d'utilisateur (objet imbriqué dans Firestore)
 */
export interface TypeUtilisateur {
  id_type_utilisateur: number;
  libelle: string;
}

/**
 * Enum des types d'utilisateurs
 */
export enum TypeUtilisateurEnum {
  MANAGER = 1,
  UTILISATEUR = 2
}

/**
 * Valeurs par défaut des types d'utilisateurs (fallback si Firestore indisponible)
 */
export const TYPE_UTILISATEUR_OPTIONS: TypeUtilisateur[] = [
  { id_type_utilisateur: 1, libelle: 'Manager' },
  { id_type_utilisateur: 2, libelle: 'Utilisateur' }
];
