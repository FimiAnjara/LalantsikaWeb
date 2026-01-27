<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class SyncService
{
    protected FirestoreService $firestore;

    public function __construct(FirestoreService $firestore)
    {
        $this->firestore = $firestore;
    }

    /**
     * Sync a single user to Firestore
     */
    public function syncUser(User $user): bool
    {
        try {
            // Vérifier la disponibilité de Firestore
            if (!$this->firestore->isAvailable()) {
                Log::warning("Firestore not available. User {$user->id_utilisateur} not synchronized.");
                return false;
            }

            // Préparer les données (sans le mot de passe)
            $userData = [
                'id_utilisateur' => $user->id_utilisateur,
                'identifiant' => $user->identifiant,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'dtn' => $user->dtn ? $user->dtn->format('Y-m-d') : null,
                'email' => $user->email,
                'id_sexe' => $user->id_sexe,
                'id_type_utilisateur' => $user->id_type_utilisateur,
                'last_sync_at' => now()->toIso8601String(),
            ];

            // Synchroniser avec Firestore
            if ($this->firestore->saveUtilisateur($userData)) {
                // Marquer comme synchronisé
                $user->synchronized = true;
                $user->last_sync_at = now();
                $user->save();

                Log::info("User {$user->id_utilisateur} synchronized successfully.");
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error("Sync failed for user {$user->id_utilisateur}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Sync all unsynchronized users
     */
    public function syncUnsynchronizedUsers(): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'skipped' => 0
        ];

        if (!$this->firestore->isAvailable()) {
            $results['skipped'] = User::where('synchronized', false)->count();
            Log::warning("Firestore not available. Skipping synchronization.");
            return $results;
        }

        $unsyncedUsers = User::where('synchronized', false)->get();

        foreach ($unsyncedUsers as $user) {
            if ($this->syncUser($user)) {
                $results['success']++;
            } else {
                $results['failed']++;
            }
        }

        return $results;
    }

    /**
     * Force sync a user (even if already synchronized)
     */
    public function forceSyncUser(User $user): bool
    {
        $user->synchronized = false;
        return $this->syncUser($user);
    }

    /**
     * Check Firestore availability
     */
    public function checkConnection(): array
    {
        $isAvailable = $this->firestore->isAvailable();
        
        return [
            'firestore_available' => $isAvailable,
            'message' => $isAvailable 
                ? 'Firestore is available and ready' 
                : 'Firestore is not available. Working in offline mode.',
            'unsynchronized_count' => User::where('synchronized', false)->count()
        ];
    }
}
