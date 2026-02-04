import { 
  collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'parametre';

class ParametreService {
    private getCollectionRef() {
        return collection(db, COLLECTION_NAME);
    }  

    async getMaxTentatives(): Promise<number> {
        try {
            const querySnapshot = await getDocs(this.getCollectionRef());
            
            if (querySnapshot.empty) {
                console.warn('Aucun paramètre trouvé, utilisation de la valeur par défaut');
                return 3; // Valeur par défaut
            }

            const doc = querySnapshot.docs[0];
            const data = doc.data();
            
            return data.tentative_max || 3;
        } catch (error) {
            console.error('Erreur lors de la récupération des paramètres:', error);
            return 3;// Valeur par défaut
        }
    }
}

export const parametreService = new ParametreService();