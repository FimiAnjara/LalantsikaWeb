/**
 * Interface représentant le statut d'un signalement (objet imbriqué dans Firestore)
 */
export interface Statut {
  id_statut: number;
  libelle: string;
}

/**
 * Enum des statuts de signalement
 */
export enum StatutEnum {
  NOUVEAU = 1,
  EN_COURS = 2,
  TERMINE = 3,
  REJETE = 4
}

/**
 * Valeurs par défaut des statuts (fallback si Firestore indisponible)
 */
export const STATUT_OPTIONS: Statut[] = [
  { id_statut: 1, libelle: 'Nouveau' },
  { id_statut: 2, libelle: 'En cours' },
  { id_statut: 3, libelle: 'Terminé' },
  { id_statut: 4, libelle: 'Rejeté' }
];

/**
 * Obtenir le type CSS du statut (helper synchrone)
 * Utilisé pour les classes CSS et les badges
 */
export const getStatutType = (id_statut: number): string => {
  const types: Record<number, string> = {
    [StatutEnum.NOUVEAU]: 'warning',
    [StatutEnum.EN_COURS]: 'info',
    [StatutEnum.TERMINE]: 'success',
    [StatutEnum.REJETE]: 'danger'
  };
  return types[id_statut] || 'default';
};

/**
 * Obtenir la couleur du statut (helper synchrone)
 */
export const getStatutColor = (id_statut: number): string => {
  const colors: Record<number, string> = {
    [StatutEnum.NOUVEAU]: '#ff9800',
    [StatutEnum.EN_COURS]: '#2196f3',
    [StatutEnum.TERMINE]: '#4caf50',
    [StatutEnum.REJETE]: '#f44336'
  };
  return colors[id_statut] || '#999999';
};

/**
 * Obtenir le libellé du statut par son ID (helper synchrone)
 * Note: Préférer utiliser directement statut.libelle si disponible
 */
export const getStatutLibelle = (id_statut: number): string => {
  const statut = STATUT_OPTIONS.find(s => s.id_statut === id_statut);
  return statut?.libelle || 'Non défini';
};
