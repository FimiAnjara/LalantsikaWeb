import { collection, getDocs } from 'firebase/firestore';
import { Preferences } from '@capacitor/preferences';
import { db } from '../firebase/config';

/**
 * Interface pour les données cachées
 */
interface CacheData<T> {
  values: T[];
  timestamp: number;
}

/**
 * Service générique pour gérer les données de référence (statiques dynamiques)
 * Utilise un système de cache avec TTL pour optimiser les performances
 * 
 * Flux:
 * 1. Cache frais (< TTL) → Retourne directement le cache (5-10ms)
 * 2. Cache expiré → Fetch Firestore, met à jour le cache (300-500ms)
 * 3. Erreur réseau → Fallback sur cache ancien ou constants
 */
export class ReferenceService<T> {
  private memoryCache: T[] | null = null;
  private memoryCacheTimestamp: number = 0;

  constructor(
    private collectionName: string,
    private defaultValues: T[],
    private cacheKey: string,
    private ttl: number = 24 * 60 * 60 * 1000 // 24h par défaut
  ) {}

  /**
   * Récupère toutes les données avec stratégie de cache
   */
  async getAll(): Promise<T[]> {
    const now = Date.now();

    // 1. Check mémoire d'abord (le plus rapide)
    if (this.memoryCache && (now - this.memoryCacheTimestamp) < this.ttl) {
      console.log(`✅ [${this.collectionName}] Cache mémoire valide`);
      return this.memoryCache;
    }

    // 2. Check cache persistant
    const cached = await this.getFromCache();
    if (cached && (now - cached.timestamp) < this.ttl) {
      console.log(`✅ [${this.collectionName}] Cache persistant valide`);
      this.memoryCache = cached.values;
      this.memoryCacheTimestamp = cached.timestamp;
      return cached.values;
    }

    // 3. Fetch depuis Firestore
    try {
      console.log(`🔄 [${this.collectionName}] Fetch Firestore...`);
      const values = await this.fetchFromFirestore();
      
      // Sauvegarder dans les caches
      await this.saveToCache(values);
      this.memoryCache = values;
      this.memoryCacheTimestamp = now;
      
      return values;
    } catch (error) {
      console.error(`❌ [${this.collectionName}] Erreur Firestore:`, error);
      
      // 4. Fallback sur cache expiré
      if (cached) {
        console.log(`⚠️ [${this.collectionName}] Utilise cache expiré`);
        return cached.values;
      }
      
      // 5. Fallback sur constants
      console.log(`⚠️ [${this.collectionName}] Utilise constants par défaut`);
      return this.defaultValues;
    }
  }

  /**
   * Récupère un élément par son ID
   */
  async getById(idField: string, idValue: number): Promise<T | undefined> {
    const all = await this.getAll();
    return all.find((item: any) => item[idField] === idValue);
  }

  /**
   * Force le rafraîchissement depuis Firestore
   */
  async refresh(): Promise<T[]> {
    try {
      console.log(`🔄 [${this.collectionName}] Force refresh...`);
      const values = await this.fetchFromFirestore();
      
      await this.saveToCache(values);
      this.memoryCache = values;
      this.memoryCacheTimestamp = Date.now();
      
      return values;
    } catch (error) {
      console.error(`❌ [${this.collectionName}] Erreur refresh:`, error);
      throw error;
    }
  }

  // Vide le cache (utile pour forcer un refresh)
  async clearCache(): Promise<void> {
    this.memoryCache = null;
    this.memoryCacheTimestamp = 0;
    await Preferences.remove({ key: this.cacheKey });
    console.log(`🗑️ [${this.collectionName}] Cache vidé`);
  }

  // Récupère les données depuis le cache persistant
  private async getFromCache(): Promise<CacheData<T> | null> {
    try {
      const result = await Preferences.get({ key: this.cacheKey });
      if (result.value) {
        return JSON.parse(result.value) as CacheData<T>;
      }
      return null;
    } catch (error) {
      console.error(`❌ [${this.collectionName}] Erreur lecture cache:`, error);
      return null;
    }
  }

  // Sauvegarde les données dans le cache persistant
  private async saveToCache(values: T[]): Promise<void> {
    try {
      const data: CacheData<T> = {
        values,
        timestamp: Date.now()
      };
      await Preferences.set({
        key: this.cacheKey,
        value: JSON.stringify(data)
      });
      console.log(`💾 [${this.collectionName}] Cache sauvegardé`);
    } catch (error) {
      console.error(`❌ [${this.collectionName}] Erreur sauvegarde cache:`, error);
    }
  }

  // Fetch les données depuis Firestore
  private async fetchFromFirestore(): Promise<T[]> {
    const collectionRef = collection(db, this.collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`⚠️ [${this.collectionName}] Collection vide, utilise defaults`);
      return this.defaultValues;
    }
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      _firestore_id: doc.id
    })) as T[];
  }
}
