<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Database;

class FirestoreService
{
    protected $database;
    protected $isAvailable = false;

    public function __construct()
    {
        try {
            $serviceAccountPath = storage_path('app/firebase/service-account.json');
            
            if (!file_exists($serviceAccountPath)) {
                throw new \Exception('Firebase credentials file not found');
            }

            $factory = (new Factory)
                ->withServiceAccount($serviceAccountPath)
                ->withDatabaseUri('https://lalantsika-project-default-rtdb.asia-southeast1.firebasedatabase.app');
            
            $this->database = $factory->createDatabase();
            $this->isAvailable = true;
        } catch (\Exception $e) {
            \Log::warning('Firestore initialization failed: ' . $e->getMessage());
            $this->isAvailable = false;
        }
    }

    /**
     * Check if Firestore is available
     */
    public function isAvailable(): bool
    {
        if (!$this->isAvailable) {
            return false;
        }

        try {
            // Test de connexion simple - essayer d'accéder à la racine
            $this->database->getReference('_connection_test')->getSnapshot();
            return true;
        } catch (\Exception $e) {
            \Log::warning('Firestore connection check failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get a reference to a collection
     */
    public function collection(string $name)
    {
        if (!$this->isAvailable) {
            throw new \Exception('Firestore is not available');
        }
        return $this->database->getReference($name);
    }

    /**
     * ========================================
     * MÉTHODES UNIVERSELLES (pour toutes collections)
     * ========================================
     */

    /**
     * Sauvegarder dans n'importe quelle collection Firebase
     */
    public function saveToCollection(string $collection, $id, array $data): bool
    {
        try {
            if (!$this->isAvailable()) {
                return false;
            }

            $reference = $this->database->getReference($collection . '/' . $id);
            $reference->set($data);
            
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to save to {$collection}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Récupérer depuis n'importe quelle collection Firebase
     */
    public function getFromCollection(string $collection, $id)
    {
        try {
            if (!$this->isAvailable()) {
                return null;
            }

            $reference = $this->database->getReference($collection . '/' . $id);
            return $reference->getValue();
        } catch (\Exception $e) {
            \Log::error("Failed to get from {$collection}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Mettre à jour dans n'importe quelle collection Firebase
     */
    public function updateInCollection(string $collection, $id, array $data): bool
    {
        try {
            if (!$this->isAvailable()) {
                return false;
            }

            $reference = $this->database->getReference($collection . '/' . $id);
            $reference->update($data);
            
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to update {$collection}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprimer de n'importe quelle collection Firebase
     */
    public function deleteFromCollection(string $collection, $id): bool
    {
        try {
            if (!$this->isAvailable()) {
                return false;
            }

            $reference = $this->database->getReference($collection . '/' . $id);
            $reference->remove();
            
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to delete from {$collection}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * ========================================
     * MÉTHODES SPÉCIFIQUES (rétrocompatibilité)
     * ========================================
     */

    public function saveUtilisateur(array $userData): bool
    {
        return $this->saveToCollection('utilisateurs', $userData['id_utilisateur'], $userData);
    }

    public function getUtilisateur(int $id)
    {
        return $this->getFromCollection('utilisateurs', $id);
    }

    public function updateUtilisateur(int $id, array $data): bool
    {
        return $this->updateInCollection('utilisateurs', $id, $data);
    }

    public function deleteUtilisateur(int $id): bool
    {
        return $this->deleteFromCollection('utilisateurs', $id);
    }
}
