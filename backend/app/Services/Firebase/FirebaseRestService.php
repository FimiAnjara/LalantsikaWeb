<?php

namespace App\Services\Firebase;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Psr7\Uri;

/**
 * Service Firebase Firestore REST API
 * 
 * Utilise Cloud Firestore (PAS Realtime Database)
 * API: https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents
 */
class FirebaseRestService
{
    protected $projectId;
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->projectId = config('firebase.project_id');
        $this->apiKey = config('firebase.api_key');
        $this->baseUrl = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents";
    }

    /**
     * Créer un client HTTP configuré pour Firestore (sans encoder les parenthèses)
     */
    protected function httpClient()
    {
        return Http::withOptions([
            'curl' => [
                CURLOPT_ENCODING => '', // Accept all encodings
            ],
        ])->timeout(30);
    }

    /**
     * Construire l'URL Firestore sans encodage des parenthèses
     */
    protected function buildUrl(string $path, array $params = []): string
    {
        $params['key'] = $this->apiKey;
        $queryString = http_build_query($params);
        return "{$this->baseUrl}/{$path}?{$queryString}";
    }

    /**
     * Effectuer une requête GET vers Firestore
     */
    protected function firestoreGet(string $path, array $params = [])
    {
        $url = $this->buildUrl($path, $params);
        
        // Utiliser file_get_contents avec stream context pour éviter l'encodage
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => 'Content-Type: application/json',
                'timeout' => 30,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        $statusCode = $this->getHttpStatusCode($http_response_header ?? []);
        
        // Debug: log la requête et la réponse
        if ($statusCode === 0) {
            \Log::warning("⚠️ Firestore GET request failed: status=0 (network error or SSL issue)");
            \Log::warning("   URL: " . $url);
            \Log::warning("   Headers: " . json_encode($http_response_header ?? []));
        }
        
        return [
            'status' => $statusCode,
            'body' => $response,
            'json' => $response ? json_decode($response, true) : null
        ];
    }

    /**
     * Effectuer une requête POST/PATCH/DELETE vers Firestore
     */
    protected function firestoreRequest(string $method, string $path, ?array $data = null, array $params = [])
    {
        $url = $this->buildUrl($path, $params);
        
        $headers = ['Content-Type: application/json'];
        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'content' => $data ? json_encode($data) : '',
                'timeout' => 30,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        $statusCode = $this->getHttpStatusCode($http_response_header ?? []);
        
        return [
            'status' => $statusCode,
            'body' => $response,
            'json' => $response ? json_decode($response, true) : null
        ];
    }

    /**
     * Extraire le code HTTP des headers de réponse
     */
    protected function getHttpStatusCode(array $headers): int
    {
        if (empty($headers)) {
            return 0;
        }
        // Le premier header contient le status: "HTTP/1.1 200 OK"
        if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $headers[0], $matches)) {
            return (int) $matches[1];
        }
        return 0;
    }

    /**
     * Convertir données PHP en format Firestore
     */
    protected function toFirestoreValue($value): array
    {
        if (is_null($value)) {
            return ['nullValue' => null];
        }
        if (is_bool($value)) {
            return ['booleanValue' => $value];
        }
        if (is_int($value)) {
            return ['integerValue' => (string) $value];
        }
        if (is_float($value)) {
            return ['doubleValue' => $value];
        }
        if (is_string($value)) {
            // Vérifier si c'est une date ISO8601
            if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $value)) {
                return ['timestampValue' => $value];
            }
            return ['stringValue' => $value];
        }
        if (is_array($value)) {
            // Array associatif = map
            if (array_keys($value) !== range(0, count($value) - 1)) {
                $mapFields = [];
                foreach ($value as $k => $v) {
                    $mapFields[$k] = $this->toFirestoreValue($v);
                }
                return ['mapValue' => ['fields' => $mapFields]];
            }
            // Array indexé = array
            $arrayValues = [];
            foreach ($value as $v) {
                $arrayValues[] = $this->toFirestoreValue($v);
            }
            return ['arrayValue' => ['values' => $arrayValues]];
        }
        return ['stringValue' => (string) $value];
    }

    /**
     * Convertir format Firestore en données PHP
     */
    protected function fromFirestoreValue(array $firestoreValue)
    {
        if (isset($firestoreValue['nullValue'])) {
            return null;
        }
        if (isset($firestoreValue['booleanValue'])) {
            return $firestoreValue['booleanValue'];
        }
        if (isset($firestoreValue['integerValue'])) {
            return (int) $firestoreValue['integerValue'];
        }
        if (isset($firestoreValue['doubleValue'])) {
            return (float) $firestoreValue['doubleValue'];
        }
        if (isset($firestoreValue['stringValue'])) {
            return $firestoreValue['stringValue'];
        }
        if (isset($firestoreValue['timestampValue'])) {
            return $firestoreValue['timestampValue'];
        }
        if (isset($firestoreValue['mapValue'])) {
            $result = [];
            foreach ($firestoreValue['mapValue']['fields'] ?? [] as $k => $v) {
                $result[$k] = $this->fromFirestoreValue($v);
            }
            return $result;
        }
        if (isset($firestoreValue['arrayValue'])) {
            $result = [];
            foreach ($firestoreValue['arrayValue']['values'] ?? [] as $v) {
                $result[] = $this->fromFirestoreValue($v);
            }
            return $result;
        }
        if (isset($firestoreValue['geoPointValue'])) {
            return $firestoreValue['geoPointValue'];
        }
        if (isset($firestoreValue['referenceValue'])) {
            return $firestoreValue['referenceValue'];
        }
        return null;
    }

    /**
     * Convertir un document Firestore complet en array PHP
     */
    protected function documentToArray(array $document): array
    {
        $result = [];
        foreach ($document['fields'] ?? [] as $key => $value) {
            $result[$key] = $this->fromFirestoreValue($value);
        }
        return $result;
    }

    /**
     * Convertir un array PHP en document Firestore
     */
    protected function arrayToDocument(array $data): array
    {
        $fields = [];
        foreach ($data as $key => $value) {
            $fields[$key] = $this->toFirestoreValue($value);
        }
        return ['fields' => $fields];
    }

    /**
     * Ajouter/Mettre à jour un document dans Firestore
     */
    public function saveDocument(string $collection, string $docId, array $data): bool
    {
        try {
            Log::info("Firestore REST: Saving {$collection}/{$docId}");
            
            $firestoreDoc = $this->arrayToDocument($data);
            
            $response = $this->firestoreRequest('PATCH', "{$collection}/{$docId}", $firestoreDoc);

            if ($response['status'] === 200) {
                Log::info("✅ Firestore document saved: {$collection}/{$docId}");
                return true;
            }

            Log::error("❌ Firestore save error: " . $response['status'] . " - " . $response['body']);
            throw new \Exception("Failed to save document: " . $response['body']);

        } catch (\Exception $e) {
            Log::error("Firestore REST error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupérer un document depuis Firestore
     */
    public function getDocument(string $collection, string $docId): ?array
    {
        try {
            $response = $this->firestoreGet("{$collection}/{$docId}");

            if ($response['status'] === 200 && $response['json']) {
                return $this->documentToArray($response['json']);
            }

            if ($response['status'] === 404) {
                return null;
            }

            Log::error("Firestore get error: " . $response['status'] . " - " . $response['body']);
            throw new \Exception("Failed to get document");

        } catch (\Exception $e) {
            Log::error("Firestore REST error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Récupérer tous les documents d'une collection Firestore
     */
    public function getCollection(string $collection): array
    {
        try {
            // Vérifier les credentials
            if (empty($this->apiKey)) {
                Log::error("❌ Firebase API key not configured - cannot fetch collection {$collection}");
                throw new \Exception("Firebase API key not configured");
            }

            $response = $this->firestoreGet($collection);

            // Debug: afficher la réponse
            Log::info("Firestore getCollection({$collection}) response: status={$response['status']}, has_json=" . (isset($response['json']) ? 'yes' : 'no'));

            if ($response['status'] === 200 && $response['json']) {
                $documents = [];
                
                foreach ($response['json']['documents'] ?? [] as $doc) {
                    // Extraire l'ID du document du path
                    $pathParts = explode('/', $doc['name']);
                    $docId = end($pathParts);
                    $documents[$docId] = $this->documentToArray($doc);
                }
                
                Log::info("✅ Collection {$collection} retrieved: " . count($documents) . " documents");
                return $documents;
            }

            // Collection vide
            if ($response['status'] === 404) {
                Log::info("ℹ️ Collection {$collection} not found or empty (404)");
                return [];
            }

            // Erreur avec détails
            $body = substr($response['body'] ?? 'no body', 0, 500);
            Log::error("❌ Firestore get collection error for {$collection}: status=" . $response['status'] . ", body=" . $body);
            throw new \Exception("Failed to get collection {$collection}: " . $body);

        } catch (\Exception $e) {
            Log::error("❌ Firestore REST error in getCollection({$collection}): " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Supprimer un document de Firestore
     */
    public function deleteDocument(string $collection, string $docId): bool
    {
        try {
            $response = $this->firestoreRequest('DELETE', "{$collection}/{$docId}");

            if ($response['status'] === 200 || $response['status'] === 404) {
                Log::info("✅ Firestore document deleted: {$collection}/{$docId}");
                return true;
            }

            Log::error("Firestore delete error: " . $response['status'] . " - " . $response['body']);
            throw new \Exception("Failed to delete document");

        } catch (\Exception $e) {
            Log::error("Firestore REST error: " . $e->getMessage());
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
            Log::error("Firestore count error: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Tester la connexion Firestore
     */
    public function testConnection(): array
    {
        try {
            if (empty($this->projectId)) {
                return [
                    'success' => false,
                    'error' => 'Firebase project ID not configured'
                ];
            }

            if (empty($this->apiKey)) {
                return [
                    'success' => false,
                    'error' => 'Firebase API key not configured'
                ];
            }

            // Test en récupérant la collection utilisateurs
            Log::info("Testing Firestore connection to project: " . $this->projectId);
            
            $response = $this->firestoreGet('utilisateurs', ['pageSize' => 1]);
            
            Log::info("Firestore test response: status={$response['status']}");
            
            // 200 = OK, 403 = règles de sécurité (mais Firestore accessible)
            if ($response['status'] === 200 || $response['status'] === 403) {
                return [
                    'success' => true,
                    'status_code' => $response['status'],
                    'message' => 'Firestore connected',
                    'documents_found' => isset($response['json']['documents']) ? count($response['json']['documents']) : 0
                ];
            }
            
            return [
                'success' => false,
                'status_code' => $response['status'],
                'error' => substr($response['body'] ?? 'Unknown error', 0, 500)
            ];
            
        } catch (\Exception $e) {
            Log::error("❌ Firestore connection test failed: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Obtenir l'URL de base Firestore
     */
    public function getDatabaseUrl(): ?string
    {
        return $this->baseUrl;
    }

    /**
     * Obtenir le project ID
     */
    public function getProjectId(): ?string
    {
        return $this->projectId;
    }

    /**
     * Requête avec filtres (WHERE)
     */
    public function queryCollection(string $collection, array $filters = []): array
    {
        try {
            // Firestore REST API utilise :runQuery pour les filtres
            $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents:runQuery?key={$this->apiKey}";
            
            $structuredQuery = [
                'structuredQuery' => [
                    'from' => [['collectionId' => $collection]],
                ]
            ];

            // Ajouter les filtres WHERE
            if (!empty($filters)) {
                $compositeFilter = ['compositeFilter' => [
                    'op' => 'AND',
                    'filters' => []
                ]];

                foreach ($filters as $field => $value) {
                    $compositeFilter['compositeFilter']['filters'][] = [
                        'fieldFilter' => [
                            'field' => ['fieldPath' => $field],
                            'op' => 'EQUAL',
                            'value' => $this->toFirestoreValue($value)
                        ]
                    ];
                }

                $structuredQuery['structuredQuery']['where'] = $compositeFilter;
            }

            $response = Http::timeout(30)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, $structuredQuery);

            if ($response->successful()) {
                $results = $response->json();
                $documents = [];

                foreach ($results as $result) {
                    if (isset($result['document'])) {
                        $pathParts = explode('/', $result['document']['name']);
                        $docId = end($pathParts);
                        $documents[$docId] = $this->documentToArray($result['document']);
                    }
                }

                return $documents;
            }

            Log::error("Firestore query error: " . $response->status() . " - " . $response->body());
            return [];

        } catch (\Exception $e) {
            Log::error("Firestore query error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Créer un utilisateur dans Firebase Auth via REST API
     * 
     * @param string $email Email de l'utilisateur
     * @param string $password Mot de passe (en clair)
     * @return array|null Retourne les infos utilisateur avec localId (UID) ou null si erreur
     */
    public function createAuthUser(string $email, string $password): ?array
    {
        try {
            $url = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={$this->apiKey}";
            
            $data = [
                'email' => $email,
                'password' => $password,
                'returnSecureToken' => true
            ];
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode($data),
                    'timeout' => 30,
                    'ignore_errors' => true,
                ],
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                ]
            ]);
            
            $response = @file_get_contents($url, false, $context);
            $statusCode = $this->getHttpStatusCode($http_response_header ?? []);
            $result = json_decode($response, true);
            
            if ($statusCode === 200 && isset($result['localId'])) {
                Log::info("✅ Firebase Auth user created: {$email} -> UID: {$result['localId']}");
                return [
                    'uid' => $result['localId'],
                    'email' => $result['email'],
                    'idToken' => $result['idToken'] ?? null,
                    'refreshToken' => $result['refreshToken'] ?? null
                ];
            }
            
            // Vérifier si l'utilisateur existe déjà
            if (isset($result['error']['message']) && $result['error']['message'] === 'EMAIL_EXISTS') {
                Log::warning("⚠️ Firebase Auth user already exists: {$email} - Mot de passe inchangé!");
                Log::warning("   Pour réinitialiser: supprimez l'utilisateur dans Firebase Console ou utilisez resetPassword()");
                // Retourner un indicateur spécial
                return [
                    'exists' => true,
                    'email' => $email,
                    'uid' => null,
                    'error' => 'EMAIL_EXISTS'
                ];
            }
            
            Log::error("❌ Firebase Auth create error: " . json_encode($result));
            return null;
            
        } catch (\Exception $e) {
            Log::error("Firebase Auth error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Connecter un utilisateur Firebase Auth pour obtenir son UID
     * 
     * @param string $email Email de l'utilisateur
     * @param string $password Mot de passe
     * @return array|null Retourne les infos utilisateur avec localId (UID) ou null si erreur
     */
    public function signInAuthUser(string $email, string $password): ?array
    {
        try {
            $url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={$this->apiKey}";
            
            $data = [
                'email' => $email,
                'password' => $password,
                'returnSecureToken' => true
            ];
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode($data),
                    'timeout' => 30,
                    'ignore_errors' => true,
                ],
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                ]
            ]);
            
            $response = @file_get_contents($url, false, $context);
            $statusCode = $this->getHttpStatusCode($http_response_header ?? []);
            $result = json_decode($response, true);
            
            if ($statusCode === 200 && isset($result['localId'])) {
                return [
                    'uid' => $result['localId'],
                    'email' => $result['email'],
                    'idToken' => $result['idToken'] ?? null,
                    'refreshToken' => $result['refreshToken'] ?? null
                ];
            }
            
            Log::error("Firebase Auth sign-in error: " . json_encode($result));
            return null;
            
        } catch (\Exception $e) {
            Log::error("Firebase Auth sign-in error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Obtenir l'API Key
     */
    public function getApiKey(): ?string
    {
        return $this->apiKey;
    }

    /**
     * Envoyer un email de réinitialisation de mot de passe
     * 
     * @param string $email Email de l'utilisateur
     * @return bool True si l'email a été envoyé
     */
    public function sendPasswordResetEmail(string $email): bool
    {
        try {
            $url = "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={$this->apiKey}";
            
            $data = [
                'requestType' => 'PASSWORD_RESET',
                'email' => $email
            ];
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode($data),
                    'timeout' => 30,
                    'ignore_errors' => true,
                ],
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                ]
            ]);
            
            $response = @file_get_contents($url, false, $context);
            $statusCode = $this->getHttpStatusCode($http_response_header ?? []);
            $result = json_decode($response, true);
            
            if ($statusCode === 200) {
                Log::info("✅ Password reset email sent to: {$email}");
                return true;
            }
            
            Log::error("❌ Failed to send password reset: " . json_encode($result));
            return false;
            
        } catch (\Exception $e) {
            Log::error("Password reset error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprimer un utilisateur Firebase Auth (nécessite un idToken valide de l'utilisateur)
     * Note: Cette méthode ne peut supprimer que l'utilisateur actuellement connecté
     * Pour supprimer n'importe quel utilisateur, utilisez la Console Firebase ou l'Admin SDK
     */
    public function deleteAuthUser(string $idToken): bool
    {
        try {
            $url = "https://identitytoolkit.googleapis.com/v1/accounts:delete?key={$this->apiKey}";
            
            $data = [
                'idToken' => $idToken
            ];
            
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/json',
                    'content' => json_encode($data),
                    'timeout' => 30,
                    'ignore_errors' => true,
                ],
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                ]
            ]);
            
            $response = @file_get_contents($url, false, $context);
            $statusCode = $this->getHttpStatusCode($http_response_header ?? []);
            
            if ($statusCode === 200) {
                Log::info("✅ Firebase Auth user deleted");
                return true;
            }
            
            $result = json_decode($response, true);
            Log::error("❌ Failed to delete user: " . json_encode($result));
            return false;
            
        } catch (\Exception $e) {
            Log::error("Delete user error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtenir un access token OAuth2 via le service account pour les API Admin
     */
    protected function getServiceAccountAccessToken(): ?string
    {
        try {
            $serviceAccountPath = storage_path('app/firebase/service-account.json');
            
            if (!file_exists($serviceAccountPath)) {
                Log::error("❌ Service account file not found");
                return null;
            }

            $sa = json_decode(file_get_contents($serviceAccountPath), true);
            
            // Créer le JWT
            $now = time();
            $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $claims = base64_encode(json_encode([
                'iss' => $sa['client_email'],
                'scope' => 'https://www.googleapis.com/auth/identitytoolkit https://www.googleapis.com/auth/firebase',
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600
            ]));
            
            $signatureInput = str_replace(['+', '/', '='], ['-', '_', ''], $header) . '.' . str_replace(['+', '/', '='], ['-', '_', ''], $claims);
            
            openssl_sign($signatureInput, $signature, $sa['private_key'], 'SHA256');
            $jwt = $signatureInput . '.' . str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
            
            // Échanger le JWT contre un access token
            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/x-www-form-urlencoded',
                    'content' => http_build_query([
                        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                        'assertion' => $jwt
                    ]),
                    'timeout' => 30,
                    'ignore_errors' => true,
                ],
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                ]
            ]);
            
            $response = @file_get_contents('https://oauth2.googleapis.com/token', false, $context);
            $result = json_decode($response, true);
            
            if (isset($result['access_token'])) {
                return $result['access_token'];
            }
            
            Log::error("❌ Failed to get access token: " . json_encode($result));
            return null;
        } catch (\Exception $e) {
            Log::error("❌ Service account token error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Lister tous les utilisateurs Firebase Auth via l'API Admin
     */
    public function listAllAuthUsers(): array
    {
        try {
            $accessToken = $this->getServiceAccountAccessToken();
            if (!$accessToken) {
                throw new \Exception('Impossible d\'obtenir un access token pour l\'API Admin');
            }

            $users = [];
            $nextPageToken = null;

            do {
                $url = "https://identitytoolkit.googleapis.com/v1/projects/{$this->projectId}/accounts:batchGet?maxResults=100";
                if ($nextPageToken) {
                    $url .= "&nextPageToken={$nextPageToken}";
                }

                $context = stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => "Authorization: Bearer {$accessToken}\r\nContent-Type: application/json",
                        'timeout' => 30,
                        'ignore_errors' => true,
                    ],
                    'ssl' => [
                        'verify_peer' => true,
                        'verify_peer_name' => true,
                    ]
                ]);

                $response = @file_get_contents($url, false, $context);
                $result = json_decode($response, true);

                if (isset($result['users'])) {
                    foreach ($result['users'] as $user) {
                        $users[] = [
                            'uid' => $user['localId'] ?? null,
                            'email' => $user['email'] ?? null,
                            'displayName' => $user['displayName'] ?? null,
                        ];
                    }
                }

                $nextPageToken = $result['nextPageToken'] ?? null;
            } while ($nextPageToken);

            Log::info("✅ Firebase Auth: " . count($users) . " utilisateurs listés");
            return $users;
        } catch (\Exception $e) {
            Log::error("❌ Firebase Auth list users error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Supprimer un utilisateur Firebase Auth par UID via l'API Admin
     */
    public function deleteAuthUserByUid(string $uid): bool
    {
        try {
            $accessToken = $this->getServiceAccountAccessToken();
            if (!$accessToken) {
                throw new \Exception('Impossible d\'obtenir un access token');
            }

            $url = "https://identitytoolkit.googleapis.com/v1/projects/{$this->projectId}/accounts:delete";

            $context = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "Authorization: Bearer {$accessToken}\r\nContent-Type: application/json",
                    'content' => json_encode(['localId' => $uid]),
                    'timeout' => 30,
                    'ignore_errors' => true,
                ],
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                ]
            ]);

            $response = @file_get_contents($url, false, $context);
            $statusCode = $this->getHttpStatusCode($http_response_header ?? []);

            if ($statusCode === 200) {
                Log::info("✅ Firebase Auth user deleted by UID: {$uid}");
                return true;
            }

            Log::error("❌ Failed to delete user {$uid}: status={$statusCode}, body={$response}");
            return false;
        } catch (\Exception $e) {
            Log::error("❌ Delete auth user error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Supprimer tous les utilisateurs Firebase Auth
     */
    public function deleteAllAuthUsers(): array
    {
        try {
            $users = $this->listAllAuthUsers();
            $deleted = 0;
            $failed = 0;
            $errors = [];

            foreach ($users as $user) {
                if (!empty($user['uid'])) {
                    if ($this->deleteAuthUserByUid($user['uid'])) {
                        $deleted++;
                    } else {
                        $failed++;
                        $errors[] = $user['email'] ?? $user['uid'];
                    }
                }
            }

            Log::info("Firebase Auth reset: {$deleted} supprimés, {$failed} échoués sur " . count($users) . " total");

            return [
                'success' => $failed === 0,
                'total_users' => count($users),
                'deleted_count' => $deleted,
                'failed_count' => $failed,
                'errors' => $errors
            ];
        } catch (\Exception $e) {
            Log::error("❌ Delete all auth users error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'deleted_count' => 0
            ];
        }
    }
}
