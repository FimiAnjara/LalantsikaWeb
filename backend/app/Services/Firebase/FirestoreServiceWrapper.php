<?php

namespace App\Services\Firebase;

use Illuminate\Support\Facades\Log;

/**
 * @deprecated Use FirebaseRestService instead
 * Cette classe est conservée pour compatibilité mais délègue à FirebaseRestService
 */
class FirestoreService
{
    protected $firebaseRestService;

    public function __construct()
    {
        $this->firebaseRestService = app(FirebaseRestService::class);
    }

    public function isAvailable(): bool
    {
        return $this->firebaseRestService->testConnection();
    }

    public function saveToCollection(string $collection, $id, array $data): bool
    {
        return $this->firebaseRestService->saveDocument($collection, (string)$id, $data);
    }

    public function getFromCollection(string $collection, $id)
    {
        return $this->firebaseRestService->getDocument($collection, (string)$id);
    }

    public function updateInCollection(string $collection, $id, array $data): bool
    {
        return $this->firebaseRestService->saveDocument($collection, (string)$id, $data);
    }

    public function deleteFromCollection(string $collection, $id): bool
    {
        return $this->firebaseRestService->deleteDocument($collection, (string)$id);
    }

    public function getFromCollectionByField(string $collection, string $field, $value)
    {
        $allDocs = $this->firebaseRestService->getCollection($collection);
        
        foreach ($allDocs as $id => $doc) {
            if (is_array($doc) && isset($doc[$field]) && $doc[$field] == $value) {
                return $doc;
            }
        }
        
        return null;
    }

    public function collection(string $name)
    {
        Log::warning("FirestoreService::collection() is deprecated. Use FirebaseRestService instead.");
        return new class($this->firebaseRestService, $name) {
            private $service;
            private $collection;
            
            public function __construct($service, $collection) {
                $this->service = $service;
                $this->collection = $collection;
            }
            
            public function document($id) {
                return new class($this->service, $this->collection, $id) {
                    private $service;
                    private $collection;
                    private $id;
                    
                    public function __construct($service, $collection, $id) {
                        $this->service = $service;
                        $this->collection = $collection;
                        $this->id = $id;
                    }
                    
                    public function set($data) {
                        return $this->service->saveDocument($this->collection, $this->id, $data);
                    }
                    
                    public function snapshot() {
                        $data = $this->service->getDocument($this->collection, $this->id);
                        return new class($data) {
                            private $data;
                            public function __construct($data) { $this->data = $data; }
                            public function exists() { return $this->data !== null; }
                            public function data() { return $this->data; }
                        };
                    }
                };
            }
        };
    }
}
