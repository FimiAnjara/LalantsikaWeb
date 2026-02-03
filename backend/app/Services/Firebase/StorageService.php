<?php

namespace App\Services\Firebase;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Storage;
use Illuminate\Support\Facades\Log;

/**
 * Service Storage pour la gestion des fichiers Firebase Storage
 * Permet l'upload et la gestion des images
 */
class StorageService
{
    protected $storage;
    protected $bucket;
    protected $isAvailable = false;
    protected $bucketName = 'lalantsika-project.appspot.com';

    public function __construct()
    {
        try {
            $serviceAccountPath = storage_path('app/firebase/service-account.json');
            
            Log::info('🔍 Firebase Storage initialization - Checking credentials at: ' . $serviceAccountPath);
            
            if (!file_exists($serviceAccountPath)) {
                throw new \Exception('Firebase credentials file not found at: ' . $serviceAccountPath);
            }

            $factory = (new Factory)
                ->withServiceAccount($serviceAccountPath)
                ->withDefaultStorageBucket($this->bucketName);
            
            $this->storage = $factory->createStorage();
            $this->bucket = $this->storage->getBucket();
            $this->isAvailable = true;
            
            Log::info('✅ Firebase Storage initialized successfully');
        } catch (\Exception $e) {
            Log::error('❌ Firebase Storage initialization FAILED: ' . $e->getMessage());
            $this->isAvailable = false;
        }
    }

    /**
     * Vérifier si le service est disponible
     */
    public function isAvailable(): bool
    {
        return $this->isAvailable;
    }

    /**
     * Upload une image depuis des données base64
     * @param string $base64Data Les données en base64 (avec ou sans préfixe data:image/...)
     * @param string $folder Le dossier de destination (ex: 'profiles', 'signalements')
     * @param string|null $filename Le nom du fichier (optionnel)
     * @return array ['success' => bool, 'url' => string, 'path' => string, 'error' => string|null]
     */
    public function uploadBase64(string $base64Data, string $folder = 'uploads', ?string $filename = null): array
    {
        if (!$this->isAvailable) {
            return [
                'success' => false,
                'error' => 'Firebase Storage n\'est pas disponible'
            ];
        }

        try {
            // Extraire le format et les données pures
            $extension = 'jpeg';
            $pureBase64 = $base64Data;

            if (preg_match('/^data:image\/(\w+);base64,(.+)$/', $base64Data, $matches)) {
                $extension = $matches[1];
                $pureBase64 = $matches[2];
            }

            // Décoder le base64
            $imageData = base64_decode($pureBase64);
            if ($imageData === false) {
                return [
                    'success' => false,
                    'error' => 'Données base64 invalides'
                ];
            }

            // Générer le nom de fichier
            $timestamp = time();
            $randomId = substr(str_shuffle('abcdefghijklmnopqrstuvwxyz0123456789'), 0, 6);
            $finalFilename = $filename ?: "{$timestamp}_{$randomId}";
            $fullFilename = "{$finalFilename}.{$extension}";
            $storagePath = "{$folder}/{$fullFilename}";
            $contentType = "image/{$extension}";

            Log::info("📤 Uploading to Firebase Storage: {$storagePath}");

            // Upload vers Firebase Storage
            $object = $this->bucket->upload($imageData, [
                'name' => $storagePath,
                'metadata' => [
                    'contentType' => $contentType,
                ]
            ]);

            // Rendre le fichier public et obtenir l'URL
            // Option 1: URL signée (expire après un certain temps)
            // $url = $object->signedUrl(new \DateTime('+100 years'));
            
            // Option 2: URL publique (nécessite des règles Storage publiques)
            $url = sprintf(
                'https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media',
                $this->bucketName,
                urlencode($storagePath)
            );

            Log::info("✅ Upload successful: {$storagePath}");
            Log::info("🔗 Public URL: {$url}");

            return [
                'success' => true,
                'url' => $url,
                'path' => $storagePath,
                'name' => $fullFilename,
                'contentType' => $contentType
            ];
        } catch (\Exception $e) {
            Log::error('❌ Upload error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Upload un fichier binaire
     * @param string $fileContent Le contenu binaire du fichier
     * @param string $folder Le dossier de destination
     * @param string $filename Le nom du fichier avec extension
     * @param string $contentType Le type MIME du fichier
     * @return array
     */
    public function uploadFile(string $fileContent, string $folder, string $filename, string $contentType): array
    {
        if (!$this->isAvailable) {
            return [
                'success' => false,
                'error' => 'Firebase Storage n\'est pas disponible'
            ];
        }

        try {
            $storagePath = "{$folder}/{$filename}";

            Log::info("📤 Uploading file to Firebase Storage: {$storagePath}");

            $object = $this->bucket->upload($fileContent, [
                'name' => $storagePath,
                'metadata' => [
                    'contentType' => $contentType,
                ]
            ]);

            $url = sprintf(
                'https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media',
                $this->bucketName,
                urlencode($storagePath)
            );

            Log::info("✅ File upload successful: {$storagePath}");

            return [
                'success' => true,
                'url' => $url,
                'path' => $storagePath,
                'name' => $filename,
                'contentType' => $contentType
            ];
        } catch (\Exception $e) {
            Log::error('❌ File upload error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Supprimer un fichier de Firebase Storage
     * @param string $path Le chemin du fichier à supprimer
     * @return array
     */
    public function deleteFile(string $path): array
    {
        if (!$this->isAvailable) {
            return [
                'success' => false,
                'error' => 'Firebase Storage n\'est pas disponible'
            ];
        }

        try {
            Log::info("🗑️ Deleting from Firebase Storage: {$path}");

            $object = $this->bucket->object($path);
            
            if ($object->exists()) {
                $object->delete();
                Log::info("✅ File deleted: {$path}");
                return ['success' => true];
            } else {
                Log::warning("⚠️ File not found: {$path}");
                return ['success' => true, 'message' => 'File not found'];
            }
        } catch (\Exception $e) {
            Log::error('❌ Delete error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
