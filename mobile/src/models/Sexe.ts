/**
 * Interface représentant le sexe (pour l'imbrication dans Firestore)
 */
export interface Sexe {
  id_sexe: number;
  libelle: string;
}

/**
 * Valeurs par défaut des sexes
 */
export const SEXE_OPTIONS: Sexe[] = [
  { id_sexe: 1, libelle: 'Masculin' },
  { id_sexe: 2, libelle: 'Féminin' }
];

/**
 * Obtenir le libellé du sexe par son ID
 */
export const getSexeLibelle = (id_sexe: number): string => {
  const sexe = SEXE_OPTIONS.find(s => s.id_sexe === id_sexe);
  return sexe?.libelle || 'Non défini';
};
