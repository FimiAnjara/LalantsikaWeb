<?php

namespace App\Services\Firebase;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Firestore;

/**
 * Service Firestore pour la gestion de la base de données Firebase
 * Fournit des méthodes CRUD pour toutes les collections
 */
class FirestoreService
{
    protected $firestore;
    protected $isAvailable = false;

    public function __construct()
    {
        try {
            $serviceAccountPath = storage_path('app/firebase/service-account.json');
            
            if (!file_exists($serviceAccountPath)) {
                throw new \Exception('Firebase credentials file not found');
            }

            $factory = (new Factory)
                ->withServiceAccount($serviceAccountPath);
            
            $this->firestore = $factory->createFirestore();
            $this->isAvailable = true;
            
            \Log::info('✅ Firestore initialized successfully with gRPC');
        } catch (\Exception $e) {
            \Log::error('❌ Firestore initialization failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            $this->isAvailable = false;
        }
    }

    /**
     * Check if Firestore is available
     */
    public function isAvailable(): bool
    {
        if (!$this->isAvailable) {
            \Log::warning('❌ Firestore not initialized');
            return false;
        }

        try {
            $testDoc = $this->firestore->database()
                ->collection('_connection_test')
                ->document('test')
                ->snapshot();
            
            \Log::info('✅ Firestore connection test SUCCESS');
            return true;
        } catch (\Exception $e) {
            \Log::error('❌ Firestore connection check failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
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
        return $this->firestore->database()->collection($name);
    }

    /**
     * Sauvegarder dans n'importe quelle collection Firestore
     */
    public function saveToCollection(string $collection, $id, array $data): bool
    {
        try {
            if (!$this->isAvailable()) {
                return false;
            }

            $this->firestore->database()
                ->collection($collection)
                ->document((string)$id)
                ->set($data);
            
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to save to {$collection}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Récupérer depuis n'importe quelle collection Firestore
     */
    public function getFromCollection(string $collection, $id)
    {
        try {
            if (!$this->isAvailable()) {
                return null;
            }

            $snapshot = $this->firestore->database()
                ->collection($collection)
                ->document((string)$id)
                ->snapshot();
            
            return $snapshot->exists() ? $snapshot->data() : null;
        } catch (\Exception $e) {
            \Log::error("Failed to get from {$collection}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Mettre à jour dans n'importe quelle collection Firestore
     */
    public function updateInCollection(string $collection, $id, array $data): bool
    {
        try {
            if (!$this->isAvailable()) {
                return false;
            }

            $this->firestore->database()
                ->collection($collection)
                ->document((string)$id)
                ->update($data);
            
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to update {$collection}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprimer de n'importe quelle collection Firestore
     */
    public function deleteFromCollection(string $collection, $id): bool
    {
        try {
            if (!$this->isAvailable()) {
                return false;
            }

            $this->firestore->database()
                ->collection($collection)
                ->document((string)$id)
                ->delete();
            
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to delete from {$collection}: " . $e->getMessage());
            return false;
        }
    }
}
