import { ReferenceService } from './referenceService';
import { Sexe, SEXE_OPTIONS } from '@/models/Sexe';

/**
 * Service pour gérer les données de sexe
 * Cache TTL: 24h (données rarement modifiées)
 */
class SexeService extends ReferenceService<Sexe> {
  constructor() {
    super(
      'sexe',           // Collection Firestore
      SEXE_OPTIONS,     // Valeurs par défaut
      'cache_sexe',     // Clé de cache
      24 * 60 * 60 * 1000 // TTL: 24h
    );
  }

  /**
   * Récupère un sexe par son ID
   */
  async getByIdSexe(id_sexe: number): Promise<Sexe | undefined> {
    return this.getById('id_sexe', id_sexe);
  }

  /**
   * Récupère le libellé d'un sexe par son ID
   */
  async getLibelle(id_sexe: number): Promise<string> {
    const sexe = await this.getByIdSexe(id_sexe);
    return sexe?.libelle || 'Non défini';
  }
}

export const sexeService = new SexeService();
