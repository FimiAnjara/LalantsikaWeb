/**
 * Interface représentant le type d'utilisateur (pour l'imbrication dans Firestore)
 */
export interface TypeUtilisateur {
  id_type_utilisateur: number;
  libelle: string;
}

/**
 * Enum des types d'utilisateurs
 */
export enum TypeUtilisateurEnum {
  ADMINISTRATEUR = 1,
  MANAGER = 2,
  UTILISATEUR = 3
}

/**
 * Valeurs par défaut des types d'utilisateurs
 */
export const TYPE_UTILISATEUR_OPTIONS: TypeUtilisateur[] = [
  { id_type_utilisateur: 1, libelle: 'Administrateur' },
  { id_type_utilisateur: 2, libelle: 'Manager' },
  { id_type_utilisateur: 3, libelle: 'Utilisateur' }
];

/**
 * Obtenir le libellé du type d'utilisateur par son ID
 */
export const getTypeUtilisateurLibelle = (id_type_utilisateur: number): string => {
  const type = TYPE_UTILISATEUR_OPTIONS.find(t => t.id_type_utilisateur === id_type_utilisateur);
  return type?.libelle || 'Non défini';
};

/**
 * Vérifier si c'est un administrateur
 */
export const isTypeAdmin = (id_type_utilisateur: number): boolean => {
  return id_type_utilisateur === TypeUtilisateurEnum.ADMINISTRATEUR;
};

/**
 * Vérifier si c'est un manager (par id_type_utilisateur)
 */
export const isTypeManager = (id_type_utilisateur: number): boolean => {
  return id_type_utilisateur === TypeUtilisateurEnum.MANAGER;
};
