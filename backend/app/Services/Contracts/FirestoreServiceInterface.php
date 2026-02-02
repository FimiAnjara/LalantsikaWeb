<?php

namespace App\Services\Contracts;

/**
 * Interface pour les opérations Firestore
 * Définit le contrat que tous les services Firestore doivent respecter
 */
interface FirestoreServiceInterface
{
    /**
     * Vérifier si Firestore est disponible
     */
    public function isAvailable(): bool;

    /**
     * Obtenir une référence à une collection
     */
    public function collection(string $name);

    /**
     * Sauvegarder un document dans une collection
     */
    public function saveToCollection(string $collection, $id, array $data): bool;

    /**
     * Récupérer un document d'une collection
     */
    public function getFromCollection(string $collection, $id);

    /**
     * Mettre à jour un document dans une collection
     */
    public function updateInCollection(string $collection, $id, array $data): bool;

    /**
     * Supprimer un document d'une collection
     */
    public function deleteFromCollection(string $collection, $id): bool;

    /**
     * Récupérer un document par champ
     */
    public function getFromCollectionByField(string $collection, string $field, $value);
}
