import { ReferenceService } from './referenceService';
import { Statut, STATUT_OPTIONS, StatutEnum } from '@/models/Statut';

/**
 * Service pour gérer les statuts de signalement
 * Cache TTL: 24h (données rarement modifiées)
 */
class StatutService extends ReferenceService<Statut> {
  constructor() {
    super(
      'statut',         // Collection Firestore
      STATUT_OPTIONS,   // Valeurs par défaut
      'cache_statut',   // Clé de cache
      24 * 60 * 60 * 1000 // TTL: 24h
    );
  }

  /**
   * Récupère un statut par son ID
   */
  async getByIdStatut(id_statut: number): Promise<Statut | undefined> {
    return this.getById('id_statut', id_statut);
  }

  /**
   * Récupère le libellé d'un statut par son ID
   */
  async getLibelle(id_statut: number): Promise<string> {
    const statut = await this.getByIdStatut(id_statut);
    return statut?.libelle || 'Non défini';
  }

  /**
   * Récupère la couleur d'un statut pour l'affichage
   */
  getColor(id_statut: number): string {
    const colors: Record<number, string> = {
      [StatutEnum.EN_ATTENTE]: '#ff9800', // Orange
      [StatutEnum.EN_COURS]: '#2196f3',   // Bleu
      [StatutEnum.TERMINE]: '#4caf50',    // Vert
      [StatutEnum.REJETE]: '#f44336'      // Rouge
    };
    return colors[id_statut] || '#999999';
  }

  /**
   * Vérifie si un statut est terminé
   */
  isTermine(id_statut: number): boolean {
    return id_statut === StatutEnum.TERMINE;
  }

  /**
   * Vérifie si un statut est en cours
   */
  isEnCours(id_statut: number): boolean {
    return id_statut === StatutEnum.EN_COURS;
  }
}

export const statutService = new StatutService();
