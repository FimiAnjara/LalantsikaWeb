<?php

namespace App\Services\Contracts;

/**
 * Interface pour les opérations utilisateur sur Firestore
 */
interface UtilisateurFirebaseServiceInterface
{
    /**
     * Créer un utilisateur avec ID généré
     */
    public function createUser(array $data): string;

    /**
     * Créer un utilisateur avec ID spécifique
     */
    public function createUserWithId(string $userId, array $data): void;

    /**
     * Récupérer un utilisateur par ID
     */
    public function getUserById(string $userId): ?array;

    /**
     * Récupérer tous les utilisateurs
     */
    public function getAllUsers(): array;

    /**
     * Mettre à jour un utilisateur
     */
    public function updateUser(string $userId, array $data): void;

    /**
     * Supprimer un utilisateur
     */
    public function deleteUser(string $userId): void;

    /**
     * Synchroniser un utilisateur de la base de données
     */
    public function syncUserFromDatabase($utilisateur): void;

    /**
     * Récupérer des utilisateurs par champ
     */
    public function getUsersByField(string $field, $value): array;
}
