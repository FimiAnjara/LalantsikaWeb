/**
 * Interface représentant le sexe (objet imbriqué dans Firestore)
 */
export interface Sexe {
  id_sexe: number;
  libelle: string;
}

/**
 * Valeurs par défaut des sexes (fallback si Firestore indisponible)
 */
export const SEXE_OPTIONS: Sexe[] = [
  { id_sexe: 1, libelle: 'Masculin' },
  { id_sexe: 2, libelle: 'Féminin' }
];
