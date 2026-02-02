/**
 * Interface représentant une entreprise (pour l'imbrication dans Firestore)
 */
export interface Entreprise {
  id_entreprise: number;
  nom: string;
}

/**
 * Interface complète pour la gestion des entreprises
 */
export interface EntrepriseComplete extends Entreprise {
  last_sync_at?: string;
  synchronized?: boolean;
}
