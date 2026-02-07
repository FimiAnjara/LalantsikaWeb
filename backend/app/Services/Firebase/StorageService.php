<?php

namespace App\Services\Firebase;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service Storage pour la gestion des images via ImgBB
 * Upload gratuit illimité avec URLs publiques permanentes
 */
class StorageService
{
    protected $apiKey = 'afb517eaa4f24cc9888c2110bdd9a431';
    protected $apiUrl = 'https://api.imgbb.com/1/upload';
    /**
     * Upload une image depuis des données base64
     * @param string $base64Data Les données en base64 (avec ou sans préfixe data:image/...)
     * @param string $folder Le dossier (utilisé pour nommer le fichier)
     * @param string|null $filename Le nom du fichier (optionnel)
     * @return array ['success' => bool, 'url' => string, 'error' => string|null]
     */
    public function uploadBase64(string $base64Data, string $folder = 'uploads', ?string $filename = null): array
    {
        try {
            // Extraire les données base64 pures (sans préfixe data:image/...)
            $pureBase64 = $base64Data;
            if (preg_match('/^data:image\/\w+;base64,(.+)$/', $base64Data, $matches)) {
                $pureBase64 = $matches[1];
            }

            // Générer le nom de fichier
            $timestamp = time();
            $randomId = substr(str_shuffle('abcdefghijklmnopqrstuvwxyz0123456789'), 0, 6);
            $finalFilename = $filename ?: "{$folder}_{$timestamp}_{$randomId}";

            Log::info("📤 Uploading to ImgBB: {$finalFilename}");

            // Upload vers ImgBB
            $response = Http::asForm()->post($this->apiUrl, [
                'key' => $this->apiKey,
                'image' => $pureBase64,
                'name' => $finalFilename,
            ]);

            if (!$response->successful()) {
                Log::error('❌ ImgBB upload failed: ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'Erreur lors de l\'upload vers ImgBB'
                ];
            }

            $result = $response->json();

            if (!isset($result['success']) || !$result['success'] || !isset($result['data']['url'])) {
                Log::error('❌ ImgBB response error: ' . json_encode($result));
                return [
                    'success' => false,
                    'error' => $result['error']['message'] ?? 'Erreur ImgBB'
                ];
            }

            $imageUrl = $result['data']['url'];
            Log::info("✅ Upload successful to ImgBB");
            Log::info("🔗 Public URL: {$imageUrl}");

            return [
                'success' => true,
                'url' => $imageUrl,
                'path' => $finalFilename,
                'name' => $finalFilename,
                'contentType' => 'image/jpeg'
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
     * @param string $filename Le nom du fichier
     * @param string $contentType Le type MIME du fichier
     * @return array
     */
    public function uploadFile(string $fileContent, string $folder, string $filename, string $contentType): array
    {
        try {
            // Convertir en base64
            $base64Data = base64_encode($fileContent);
            
            return $this->uploadBase64($base64Data, $folder, $filename);
        } catch (\Exception $e) {
            Log::error('❌ File upload error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Supprimer un fichier (non supporté par ImgBB API publique)
     * @param string $path Le chemin du fichier
     * @return array
     */
    public function deleteFile(string $path): array
    {
        Log::warning("⚠️ ImgBB does not support public deletion API");
        Log::info("ℹ️ Image kept: {$path}");
        return ['success' => true, 'message' => 'ImgBB keeps images indefinitely'];
    }

    /**
     * Vérifier si le service est disponible
     */
    public function isAvailable(): bool
    {
        return true; // ImgBB est toujours disponible
    }
}
