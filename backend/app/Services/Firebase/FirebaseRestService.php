<?php

namespace App\Services\Firebase;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseRestService
{
    protected $databaseUrl;

    public function __construct()
    {
        $this->databaseUrl = config('firebase.database_url');
    }

    /**
     * Ajouter/Mettre à jour un document
     */
    public function saveDocument(string $collection, string $docId, array $data): bool
    {
        try {
            $url = "{$this->databaseUrl}/{$collection}/{$docId}.json";
            
            Log::info("Firebase REST: Saving {$collection}/{$docId}");
            
            $response = Http::timeout(30)->put($url, $data);

            if ($response->successful()) {
                Log::info("✅ Firebase document saved: {$collection}/{$docId}");
                return true;
            }

            Log::error("❌ Firebase save error: " . $response->body());
            throw new \Exception("Failed to save document: " . $response->body());

        } catch (\Exception $e) {
            Log::error("Firebase REST error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupérer un document
     */
    public function getDocument(string $collection, string $docId): ?array
    {
        try {
            $url = "{$this->databaseUrl}/{$collection}/{$docId}.json";
            
            $response = Http::timeout(30)->get($url);

            if ($response->successful()) {
                $data = $response->json();
                return $data !== null ? $data : null;
            }

            if ($response->status() === 404) {
                return null;
            }

            Log::error("Firebase get error: " . $response->body());
            throw new \Exception("Failed to get document");

        } catch (\Exception $e) {
            Log::error("Firebase REST error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupérer tous les documents d'une collection
     */
    public function getCollection(string $collection): array
    {
        try {
            $url = "{$this->databaseUrl}/{$collection}.json";
            
            $response = Http::timeout(30)->get($url);

            if ($response->successful()) {
                $data = $response->json();
                $documents = [];
                
                if (is_array($data)) {
                    foreach ($data as $id => $doc) {
                        $documents[$id] = $doc;
                    }
                }
                
                return $documents;
            }

            Log::error("Firebase get collection error: " . $response->body());
            throw new \Exception("Failed to get collection");

        } catch (\Exception $e) {
            Log::error("Firebase REST error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Supprimer un document
     */
    public function deleteDocument(string $collection, string $docId): bool
    {
        try {
            $url = "{$this->databaseUrl}/{$collection}/{$docId}.json";
            
            $response = Http::timeout(30)->delete($url);

            if ($response->successful() || $response->status() === 404) {
                Log::info("✅ Firebase document deleted: {$collection}/{$docId}");
                return true;
            }

            Log::error("Firebase delete error: " . $response->body());
            throw new \Exception("Failed to delete document");

        } catch (\Exception $e) {
            Log::error("Firebase REST error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Compter les documents dans une collection
     */
    public function countDocuments(string $collection): int
    {
        try {
            $documents = $this->getCollection($collection);
            return count($documents);
        } catch (\Exception $e) {
            Log::error("Firebase count error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Tester la connexion Firebase
     */
    public function testConnection(): bool
    {
        try {
            if (empty($this->databaseUrl)) {
                Log::error("❌ Firebase database URL not configured");
                return false;
            }

            $url = "{$this->databaseUrl}/.json?shallow=true";
            Log::info("Testing Firebase connection to: " . $this->databaseUrl);
            
            $response = Http::timeout(5)->get($url);
            
            // 401 = Unauthorized (règles de sécurité Firebase)
            // C'est normal si les règles exigent une auth - Firebase est accessible
            if ($response->successful() || $response->status() === 401) {
                Log::info("✅ Firebase REST connection successful (status: " . $response->status() . ")");
                return true;
            }
            
            Log::warning("⚠️ Firebase REST connection failed: " . $response->status() . " - " . $response->body());
            return false;
            
        } catch (\Exception $e) {
            Log::error("❌ Firebase connection test failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtenir l'URL de la base de données
     */
    public function getDatabaseUrl(): ?string
    {
        return $this->databaseUrl;
    }
}
