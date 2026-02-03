import { auth } from '../firebase/config';

// Configuration ImgBB
const IMGBB_API_KEY = 'afb517eaa4f24cc9888c2110bdd9a431';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Service pour gérer le stockage d'images via ImgBB
 * Upload gratuit illimité avec URLs publiques permanentes
 * Les images sont accessibles depuis mobile et web
 */
class StorageService {
  /**
   * Upload une image en Base64 vers ImgBB
   * @param base64Data - Données de l'image en base64 (avec ou sans préfixe data:image/...)
   * @param folder - Non utilisé (pour compatibilité), ImgBB gère le stockage
   * @param filename - Nom du fichier (optionnel)
   * @returns URL publique de l'image uploadée
   */
  async uploadBase64Image(
    base64Data: string,
    folder: string = 'signalements',
    filename?: string
  ): Promise<string> {
    try {
      // Vérifier que l'utilisateur est connecté
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Générer un nom de fichier unique si non fourni
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const finalFilename = filename || `${folder}_${user.uid}_${timestamp}_${randomId}`;

      console.log('📤 Upload vers ImgBB:', finalFilename);

      // Extraire les données base64 pures (sans préfixe data:image/...)
      let pureBase64 = base64Data;
      if (base64Data.startsWith('data:image/')) {
        const matches = base64Data.match(/^data:image\/\w+;base64,(.+)$/);
        if (matches) {
          pureBase64 = matches[1];
        }
      }

      // Créer le FormData pour ImgBB
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', pureBase64);
      formData.append('name', finalFilename);

      // Upload vers ImgBB
      const response = await fetch(IMGBB_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Erreur lors de l\'upload');
      }

      const imageUrl = result.data.url;
      console.log('✅ Upload réussi vers ImgBB');
      console.log('🔗 URL publique:', imageUrl);

      return imageUrl;
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload:', error);
      throw new Error(`Erreur lors de l'upload de l'image: ${error.message}`);
    }
  }

  /**
   * Upload un fichier Blob/File vers ImgBB
   * @param file - Fichier à uploader
   * @param folder - Non utilisé (pour compatibilité)
   * @param filename - Nom du fichier (optionnel)
   * @returns URL publique de l'image uploadée
   */
  async uploadFile(
    file: Blob | File,
    folder: string = 'signalements',
    filename?: string
  ): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Convertir le fichier en base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string;
            const url = await this.uploadBase64Image(base64Data, folder, filename);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
        reader.readAsDataURL(file);
      });
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'upload:', error);
      throw new Error(`Erreur lors de l'upload du fichier: ${error.message}`);
    }
  }

  /**
   * Supprimer une image de ImgBB
   * Note: ImgBB ne fournit pas d'API de suppression publique
   * Les images restent stockées indéfiniment (gratuit)
   * @param imageUrl - URL de l'image (ignorée, juste pour compatibilité)
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      console.log('⚠️ ImgBB ne permet pas la suppression d\'images via API publique');
      console.log('ℹ️ L\'image reste stockée:', imageUrl);
      // Ne rien faire - ImgBB garde les images indéfiniment
    } catch (error: any) {
      console.error('❌ Erreur:', error);
    }
  }

  /**
   * Vérifie si une chaîne est une URL (et non du base64)
   * @param str - Chaîne à vérifier
   * @returns true si c'est une URL
   */
  isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
  }

  /**
   * Vérifie si une chaîne est du base64
   * @param str - Chaîne à vérifier
   * @returns true si c'est du base64
   */
  isBase64(str: string): boolean {
    return str.startsWith('data:image/');
  }

  /**
   * Convertit une image en URL si c'est du base64, sinon retourne l'URL telle quelle
   * @param imageData - Données de l'image (URL ou base64)
   * @param folder - Dossier de destination pour l'upload
   * @returns URL de l'image
   */
  async ensureImageUrl(imageData: string, folder: string = 'signalements'): Promise<string> {
    if (this.isUrl(imageData)) {
      // C'est déjà une URL, on la retourne
      return imageData;
    }

    if (this.isBase64(imageData)) {
      // C'est du base64, on upload vers ImgBB
      return await this.uploadBase64Image(imageData, folder);
    }

    // Format inconnu, on retourne tel quel
    console.warn('⚠️ Format d\'image non reconnu');
    return imageData;
  }
}

export const storageService = new StorageService();
