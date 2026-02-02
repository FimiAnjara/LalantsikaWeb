<?php

namespace App\Services;

use App\Services\Contracts\UtilisateurFirebaseServiceInterface;
use App\Services\Firebase\FirebaseRestService;
use Illuminate\Support\Facades\Log;

/**
 * Service pour gérer les utilisateurs dans Firebase Realtime Database
 * Utilise l'API REST (pas de gRPC requis)
 */
class UtilisateurFirebaseService implements UtilisateurFirebaseServiceInterface
{
    protected $firebaseRestService;

    public function __construct(FirebaseRestService $firebaseRestService)
    {
        $this->firebaseRestService = $firebaseRestService;
    }

    /**
     * Ajouter un utilisateur dans Firebase avec un ID généré
     */
    public function createUser(array $data): string
    {
        $data['created_at'] = now()->toIso8601String();
        $data['synced'] = true;
        
        // Générer un ID unique
        $userId = uniqid('user_');
        
        $this->firebaseRestService->saveDocument('utilisateurs', $userId, $data);
        
        Log::info("✅ Utilisateur créé dans Firebase: {$userId}");
        
        return $userId;
    }

    /**
     * Ajouter un utilisateur avec un ID spécifique
     */
    public function createUserWithId(string $userId, array $data): void
    {
        $data['created_at'] = $data['created_at'] ?? now()->toIso8601String();
        $data['synced'] = true;
        
        $this->firebaseRestService->saveDocument('utilisateurs', $userId, $data);
        
        Log::info("✅ Utilisateur créé avec ID: {$userId}");
    }

    /**
     * Récupérer tous les utilisateurs
     */
    public function getAllUsers(): array
    {
        try {
            $documents = $this->firebaseRestService->getCollection('utilisateurs');
            
            $users = [];
            foreach ($documents as $id => $data) {
                if (is_array($data)) {
                    $users[] = [
                        'id' => $id,
                        ...$data
                    ];
                }
            }
            
            return $users;
        } catch (\Exception $e) {
            Log::error("Erreur récupération utilisateurs: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Récupérer un utilisateur par ID
     */
    public function getUserById(string $userId): ?array
    {
        try {
            $data = $this->firebaseRestService->getDocument('utilisateurs', $userId);

            if ($data) {
                return [
                    'id' => $userId,
                    ...$data
                ];
            }

            return null;
        } catch (\Exception $e) {
            Log::error("Erreur récupération utilisateur {$userId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Rechercher des utilisateurs par un champ
     */
    public function getUsersByField(string $field, $value): array
    {
        try {
            $allUsers = $this->firebaseRestService->getCollection('utilisateurs');
            
            $results = [];
            foreach ($allUsers as $id => $data) {
                if (is_array($data) && isset($data[$field]) && $data[$field] == $value) {
                    $results[] = [
                        'id' => $id,
                        ...$data
                    ];
                }
            }
            
            return $results;
        } catch (\Exception $e) {
            Log::error("Erreur recherche utilisateurs par {$field}: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Récupérer un utilisateur par email
     */
    public function getUserByEmail(string $email): ?array
    {
        $users = $this->getUsersByField('email', $email);
        return !empty($users) ? $users[0] : null;
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function updateUser(string $userId, array $data): void
    {
        $data['updated_at'] = now()->toIso8601String();
        
        $this->firebaseRestService->saveDocument('utilisateurs', $userId, $data);
        
        Log::info("✅ Utilisateur mis à jour: {$userId}");
    }

    /**
     * Supprimer un utilisateur
     */
    public function deleteUser(string $userId): void
    {
        $this->firebaseRestService->deleteDocument('utilisateurs', $userId);
        
        Log::info("✅ Utilisateur supprimé: {$userId}");
    }

    /**
     * Synchroniser un utilisateur PostgreSQL vers Firebase
     */
    public function syncUserFromDatabase($utilisateur): void
    {
        $this->createUserWithId(
            (string) $utilisateur->id_utilisateur,
            [
                'id_utilisateur' => $utilisateur->id_utilisateur,
                'identifiant' => $utilisateur->identifiant,
                'nom' => $utilisateur->nom,
                'prenom' => $utilisateur->prenom,
                'email' => $utilisateur->email,
                'dtn' => $utilisateur->dtn ? $utilisateur->dtn->format('Y-m-d') : null,
                'id_sexe' => $utilisateur->id_sexe,
                'id_type_utilisateur' => $utilisateur->id_type_utilisateur,
                'firebase_uid' => $utilisateur->firebase_uid,
                'created_at' => $utilisateur->created_at?->toIso8601String(),
                'updated_at' => $utilisateur->updated_at?->toIso8601String(),
                'synced_at' => now()->toIso8601String()
            ]
        );
    }

    /**
     * Vérifier si Firebase est disponible
     */
    public function isAvailable(): bool
    {
        return $this->firebaseRestService->testConnection();
    }
}
