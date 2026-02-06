import { ReferenceService } from './referenceService';
import { TypeUtilisateur, TYPE_UTILISATEUR_OPTIONS, TypeUtilisateurEnum } from '@/models/TypeUtilisateur';

/**
 * Service pour gérer les types d'utilisateur
 * Cache TTL: 24h (données rarement modifiées)
 */
class TypeUtilisateurService extends ReferenceService<TypeUtilisateur> {
  constructor() {
    super(
      'type_utilisateurs',       // Collection Firestore
      TYPE_UTILISATEUR_OPTIONS,  // Valeurs par défaut
      'cache_type_utilisateur',  // Clé de cache
      24 * 60 * 60 * 1000        // TTL: 24h
    );
  }

  /**
   * Récupère un type par son ID
   */
  async getByIdType(id_type_utilisateur: number): Promise<TypeUtilisateur | undefined> {
    return this.getById('id_type_utilisateur', id_type_utilisateur);
  }

  /**
   * Récupère le libellé d'un type par son ID
   */
  async getLibelle(id_type_utilisateur: number): Promise<string> {
    const type = await this.getByIdType(id_type_utilisateur);
    return type?.libelle || 'Non défini';
  }

  /**
   * Vérifie si un type est Manager
   */
  isManager(id_type_utilisateur: number): boolean {
    return id_type_utilisateur === TypeUtilisateurEnum.MANAGER;
  }

  /**
   * Vérifie si un type est Utilisateur
   */
  isUtilisateur(id_type_utilisateur: number): boolean {
    return id_type_utilisateur === TypeUtilisateurEnum.UTILISATEUR;
  }
}

export const typeUtilisateurService = new TypeUtilisateurService();
