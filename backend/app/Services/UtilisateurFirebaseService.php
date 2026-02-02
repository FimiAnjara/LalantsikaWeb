<?php

namespace App\Services;

use App\Services\Contracts\UtilisateurFirebaseServiceInterface;
use App\Services\Firebase\FirestoreService;

class UtilisateurFirebaseService implements UtilisateurFirebaseServiceInterface
{
    protected $firestoreService;

    public function __construct(FirestoreService $firestoreService)
    {
        $this->firestoreService = $firestoreService;
    }

    /**
     * Ajouter un utilisateur dans Firestore avec un ID généré
     */
    public function createUser(array $data): string
    {
        $data['created_at'] = now()->toDateTimeString();
        $data['synced'] = true;
        
        $collection = $this->firestoreService->collection('utilisateurs');
        
        $document = $collection->newDocument();
        $document->set($data);

        return $document->id();
    }

    /**
     * Ajouter un utilisateur avec un ID spécifique
     */
    public function createUserWithId(string $userId, array $data): void
    {
        $data['created_at'] = $data['created_at'] ?? now()->toDateTimeString();
        $data['synced'] = true;
        
        $this->firestoreService->saveToCollection('utilisateurs', $userId, $data);
    }

    /**
     * Récupérer tous les utilisateurs
     */
    public function getAllUsers(): array
    {
        $collection = $this->firestoreService->collection('utilisateurs');
        $documents = $collection->documents();

        $users = [];
        foreach ($documents as $document) {
            $users[] = [
                'id' => $document->id(),
                ...$document->data()
            ];
        }

        return $users;
    }

    /**
     * Récupérer un utilisateur par ID
     */
    public function getUserById(string $userId): ?array
    {
        $data = $this->firestoreService->getFromCollection('utilisateurs', $userId);

        if ($data) {
            return [
                'id' => $userId,
                ...$data
            ];
        }

        return null;
    }

    /**
     * Rechercher des utilisateurs par un champ
     */
    public function getUsersByField(string $field, $value): array
    {
        $data = $this->firestoreService->getFromCollectionByField('utilisateurs', $field, $value);

        if ($data === null) {
            return [];
        }

        return [$data];
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function updateUser(string $userId, array $data): void
    {
        $data['updated_at'] = now()->toDateTimeString();
        $this->firestoreService->updateInCollection('utilisateurs', $userId, $data);
    }

    /**
     * Supprimer un utilisateur
     */
    public function deleteUser(string $userId): void
    {
        $this->firestoreService->deleteFromCollection('utilisateurs', $userId);
    }

    /**
     * Synchroniser un utilisateur PostgreSQL vers Firestore
     */
    public function syncUserFromDatabase($utilisateur): void
    {
        $this->createUserWithId(
            (string) $utilisateur->id_utilisateur,
            [
                'identifiant' => $utilisateur->identifiant,
                'nom' => $utilisateur->nom,
                'prenom' => $utilisateur->prenom,
                'email' => $utilisateur->email,
                'dtn' => $utilisateur->dtn,
                'id_sexe' => $utilisateur->id_sexe,
                'created_at' => $utilisateur->created_at->toDateTimeString(),
                'updated_at' => $utilisateur->updated_at?->toDateTimeString(),
                'synced_at' => now()->toDateTimeString()
            ]
        );
    }
}