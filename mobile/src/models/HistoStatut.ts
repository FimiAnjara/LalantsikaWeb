import { Statut } from './Statut';

/**
 * Interface représentant l'historique des statuts d'un signalement
 */
export interface HistoStatut {
  id_histo_statut?: number;
  firebase_id?: string;
  
  daty: string; // Date du changement de statut
  image?: string; // URL de l'image
  description?: string;
  
  // Objets imbriqués
  statut: Statut;
  id_signalement: number;
  firebase_signalement_id?: string;
  
  // Synchronisation
  last_sync_at?: string;
  synchronized: boolean;
}

/**
 * Interface pour créer un historique de statut
 */
export interface CreateHistoStatutData {
  id_statut: number;
  id_signalement: number;
  firebase_signalement_id?: string;
  description?: string;
  image?: string;
}
