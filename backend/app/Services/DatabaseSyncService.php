<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/**
 * Service universel de synchronisation PostgreSQL ↔ Firebase
 * 
 * Principe : PostgreSQL TOUJOURS en premier, Firebase en second si disponible
 */
class DatabaseSyncService
{
    protected $firestore;

    public function __construct(FirestoreService $firestore)
    {
        $this->firestore = $firestore;
    }

    /**
     * Créer un enregistrement dans PostgreSQL + Firebase
     * 
     * @param Model $model Instance Eloquent à sauvegarder
     * @param string $collection Nom de la collection Firebase
     * @param array $data Données à insérer
     * @return Model Modèle sauvegardé avec statut de synchronisation
     */
    public function create(Model $model, string $collection, array $data): Model
    {
        // Étape 1 : Sauvegarder dans PostgreSQL (PRIORITAIRE)
        $data['synchronized'] = false;
        $record = $model::create($data);

        // Étape 2 : Tenter la synchronisation Firebase
        $this->syncToFirebase($record, $collection);

        return $record->fresh();
    }

    /**
     * Mettre à jour un enregistrement dans PostgreSQL + Firebase
     */
    public function update(Model $record, string $collection, array $data): bool
    {
        // Étape 1 : Mettre à jour PostgreSQL
        $data['synchronized'] = false;
        $record->update($data);

        // Étape 2 : Tenter la synchronisation Firebase
        $this->syncToFirebase($record, $collection);

        return true;
    }

    /**
     * Supprimer un enregistrement de PostgreSQL + Firebase
     */
    public function delete(Model $record, string $collection): bool
    {
        $id = $record->getKey();

        // Étape 1 : Supprimer de Firebase (si disponible)
        if ($this->firestore->isAvailable()) {
            try {
                $this->firestore->deleteFromCollection($collection, $id);
            } catch (\Exception $e) {
                Log::warning("Firebase delete failed for {$collection}/{$id}: " . $e->getMessage());
            }
        }

        // Étape 2 : Supprimer de PostgreSQL
        return $record->delete();
    }

    /**
     * Synchroniser un enregistrement vers Firebase
     */
    protected function syncToFirebase(Model $record, string $collection): void
    {
        if (!$this->firestore->isAvailable()) {
            Log::info("Firebase indisponible - {$collection}/{$record->getKey()} marqué non synchronisé");
            return;
        }

        try {
            // Préparer les données (exclure les champs sensibles)
            $data = $record->toArray();
            unset($data['mdp'], $data['password']); // Sécurité

            // Sauvegarder dans Firebase
            $this->firestore->saveToCollection($collection, $record->getKey(), $data);

            // Marquer comme synchronisé
            $record->update([
                'synchronized' => true,
                'last_sync_at' => now()
            ]);

            Log::info("✅ {$collection}/{$record->getKey()} synchronisé avec Firebase");
        } catch (\Exception $e) {
            Log::error("❌ Sync Firebase échouée pour {$collection}/{$record->getKey()}: " . $e->getMessage());
        }
    }

    /**
     * Synchroniser tous les enregistrements non synchronisés d'un modèle
     */
    public function syncUnsynchronized(string $modelClass, string $collection): array
    {
        if (!$this->firestore->isAvailable()) {
            return ['success' => false, 'message' => 'Firebase indisponible'];
        }

        $unsyncedRecords = $modelClass::where('synchronized', false)->get();
        $synced = 0;
        $failed = 0;

        foreach ($unsyncedRecords as $record) {
            try {
                $this->syncToFirebase($record, $collection);
                $synced++;
            } catch (\Exception $e) {
                $failed++;
                Log::error("Sync failed for {$collection}/{$record->getKey()}");
            }
        }

        return [
            'success' => true,
            'total' => $unsyncedRecords->count(),
            'synced' => $synced,
            'failed' => $failed
        ];
    }

    /**
     * Vérifier l'état de la synchronisation
     */
    public function getStatus(): array
    {
        return [
            'firebase_available' => $this->firestore->isAvailable(),
            'timestamp' => now()->toIso8601String()
        ];
    }
}
