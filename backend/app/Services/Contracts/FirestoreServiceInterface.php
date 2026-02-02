<?php

namespace App\Services\Contracts;

/**
 * Interface pour les opérations Firebase REST API
 * Définit le contrat que tous les services Firebase doivent respecter
 */
interface FirestoreServiceInterface
{
    /**
     * Sauvegarder un document dans une collection
     */
    public function saveDocument(string $collection, string $docId, array $data): bool;

    /**
     * Récupérer un document d'une collection
     */
    public function getDocument(string $collection, string $docId): ?array;

    /**
     * Récupérer tous les documents d'une collection
     */
    public function getCollection(string $collection): array;

    /**
     * Supprimer un document d'une collection
     */
    public function deleteDocument(string $collection, string $docId): bool;

    /**
     * Compter les documents dans une collection
     */
    public function countDocuments(string $collection): int;

    /**
     * Tester la connexion Firebase
     */
    public function testConnection(): bool;
}
