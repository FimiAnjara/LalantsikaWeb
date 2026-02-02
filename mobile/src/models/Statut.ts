/**
 * Interface représentant le statut d'un signalement (pour l'imbrication dans Firestore)
 */
export interface Statut {
  id_statut: number;
  libelle: string;
}

/**
 * Enum des statuts de signalement
 */
export enum StatutEnum {
  EN_ATTENTE = 1,
  EN_COURS = 2,
  TERMINE = 3,
  REJETE = 4
}

/**
 * Valeurs par défaut des statuts
 */
export const STATUT_OPTIONS: Statut[] = [
  { id_statut: 1, libelle: 'En attente' },
  { id_statut: 2, libelle: 'En cours' },
  { id_statut: 3, libelle: 'Terminé' },
  { id_statut: 4, libelle: 'Rejeté' }
];

/**
 * Obtenir le libellé du statut par son ID
 */
export const getStatutLibelle = (id_statut: number): string => {
  const statut = STATUT_OPTIONS.find(s => s.id_statut === id_statut);
  return statut?.libelle || 'Non défini';
};

/**
 * Obtenir la couleur du statut pour l'affichage
 */
export const getStatutColor = (id_statut: number): string => {
  const colors: Record<number, string> = {
    1: '#ff9800', // En attente - Orange
    2: '#2196f3', // En cours - Bleu
    3: '#4caf50', // Terminé - Vert
    4: '#f44336'  // Rejeté - Rouge
  };
  return colors[id_statut] || '#999999';
};

/**
 * Obtenir le type CSS du statut
 */
export const getStatutType = (id_statut: number): string => {
  const types: Record<number, string> = {
    1: 'warning',
    2: 'info',
    3: 'success',
    4: 'danger'
  };
  return types[id_statut] || 'default';
};
