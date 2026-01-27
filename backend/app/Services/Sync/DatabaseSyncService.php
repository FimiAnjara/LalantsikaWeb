<?php

namespace App\Services\Sync;

use App\Services\Firebase\FirestoreService;
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
     */
    public function create(Model $model, string $collection, array $data): Model
    {
        $data['synchronized'] = false;
        $record = $model::create($data);

        $this->syncToFirebase($record, $collection);

        return $record->fresh();
    }

    /**
     * Mettre à jour un enregistrement dans PostgreSQL + Firebase
     */
    public function update(Model $record, string $collection, array $data): bool
    {
        $data['synchronized'] = false;
        $record->update($data);

        $this->syncToFirebase($record, $collection);

        return true;
    }

    /**
     * Supprimer un enregistrement de PostgreSQL + Firebase
     */
    public function delete(Model $record, string $collection): bool
    {
        $id = $record->getKey();

        if ($this->firestore->isAvailable()) {
            try {
                $this->firestore->deleteFromCollection($collection, $id);
            } catch (\Exception $e) {
                Log::warning("Firebase delete failed for {$collection}/{$id}: " . $e->getMessage());
            }
        }

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
            $data = $record->toArray();
            unset($data['mdp'], $data['password']);

            $this->firestore->saveToCollection($collection, $record->getKey(), $data);

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
