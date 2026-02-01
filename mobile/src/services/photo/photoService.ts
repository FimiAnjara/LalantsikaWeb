import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

/**
 * Interface pour les options de prise de photo
 */
export interface PhotoOptions {
  quality?: number; // 0-100
  allowEditing?: boolean;
  width?: number;
  height?: number;
}

/**
 * Interface pour le résultat de la photo
 */
export interface PhotoResult {
  base64String?: string;
  dataUrl?: string;
  webPath?: string;
  format: string;
}

/**
 * Service pour gérer les photos (prise de photo + galerie)
 */
class PhotoService {
  /**
   * Prendre une photo avec la caméra
   */
  async takePhoto(options: PhotoOptions = {}): Promise<PhotoResult | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: options.quality || 80,
        allowEditing: options.allowEditing || false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: options.width || 1024,
        height: options.height || 1024,
        correctOrientation: true
      });

      return this.processPhoto(photo);
    } catch (error: any) {
      console.error('Erreur lors de la prise de photo:', error);
      
      // L'utilisateur a annulé
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Sélectionner une photo depuis la galerie
   */
  async pickFromGallery(options: PhotoOptions = {}): Promise<PhotoResult | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: options.quality || 80,
        allowEditing: options.allowEditing || false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        width: options.width || 1024,
        height: options.height || 1024,
        correctOrientation: true
      });

      return this.processPhoto(photo);
    } catch (error: any) {
      console.error('Erreur lors de la sélection de photo:', error);
      
      // L'utilisateur a annulé
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Afficher un sélecteur pour choisir entre caméra et galerie
   * Retourne la source choisie ou null si annulé
   */
  async promptForSource(): Promise<'camera' | 'gallery' | null> {
    return new Promise((resolve) => {
      // Cette fonction sera appelée depuis le composant avec un ActionSheet
      // Pour l'instant, on retourne null et le composant gèrera l'UI
      resolve(null);
    });
  }

  /**
   * Obtenir une photo (affiche le choix caméra/galerie)
   */
  async getPhoto(source: 'camera' | 'gallery', options: PhotoOptions = {}): Promise<PhotoResult | null> {
    if (source === 'camera') {
      return this.takePhoto(options);
    } else {
      return this.pickFromGallery(options);
    }
  }

  /**
   * Traiter la photo et retourner le résultat formaté
   */
  private processPhoto(photo: Photo): PhotoResult {
    const format = photo.format || 'jpeg';
    const base64String = photo.base64String || '';
    
    return {
      base64String,
      dataUrl: `data:image/${format};base64,${base64String}`,
      webPath: photo.webPath,
      format
    };
  }

  /**
   * Vérifier si la caméra est disponible
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Demander les permissions caméra/galerie
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permissions:', error);
      return false;
    }
  }
}

// Export une instance unique du service
export const photoService = new PhotoService();
export default photoService;
