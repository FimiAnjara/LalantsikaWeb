<?php

namespace App\Http\Controllers;

use App\Models\Parametre;
use App\Services\Firebase\FirebaseRestService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ParametreController extends Controller
{
    protected $firebaseRest;

    public function __construct(FirebaseRestService $firebaseRest)
    {
        $this->firebaseRest = $firebaseRest;
    }
    /**
     * Récupérer les paramètres
     */
    public function index(): JsonResponse
    {
        try {
            $parametre = Parametre::first();
            
            if (!$parametre) {
                // Si aucun paramètre n'existe, retourner les valeurs par défaut
                return response()->json([
                    'success' => true,
                    'data' => [
                        'tentative_max' => 3,
                        'synchronized' => false,
                        'last_sync_at' => null
                    ]
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => $parametre
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des paramètres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer ou mettre à jour les paramètres
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'tentative_max' => 'required|integer|min:1|max:10',
            ], [
                'tentative_max.required' => 'Le nombre de tentatives maximum est requis',
                'tentative_max.integer' => 'Le nombre de tentatives maximum doit être un nombre entier',
                'tentative_max.min' => 'Le nombre de tentatives maximum doit être au moins 1',
                'tentative_max.max' => 'Le nombre de tentatives maximum ne peut pas dépasser 10',
            ]);

            $parametre = Parametre::first();
            
            if ($parametre) {
                // Mise à jour
                $parametre->update([
                    'tentative_max' => $request->tentative_max,
                    'synchronized' => false,
                    'last_sync_at' => now()
                ]);
            } else {
                // Création
                $parametre = Parametre::create([
                    'tentative_max' => $request->tentative_max,
                    'synchronized' => false,
                    'last_sync_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Paramètres sauvegardés avec succès',
                'data' => $parametre
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la sauvegarde des paramètres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser les paramètres
     */
    public function sync(): JsonResponse
    {
        try {
            $parametre = Parametre::first();
            
            if (!$parametre) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun paramètre à synchroniser'
                ], 404);
            }

            $parametre->update([
                'synchronized' => true,
                'last_sync_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Synchronisation réussie',
                'data' => $parametre
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Réinitialiser les données Firebase (supprimer les documents des collections)
     */
    public function resetFirebaseData(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'collections' => 'required|array|min:1',
                'collections.*' => 'string',
                'delete_auth_users' => 'sometimes|boolean'
            ], [
                'collections.required' => 'Veuillez sélectionner au moins une collection',
                'collections.min' => 'Veuillez sélectionner au moins une collection',
            ]);

            // Vérifier la connexion Firebase
            $connectionTest = $this->firebaseRest->testConnection();
            if (!$connectionTest['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le service Firebase n\'est pas disponible: ' . ($connectionTest['error'] ?? 'Erreur inconnue')
                ], 503);
            }

            $collections = $request->collections;
            $results = [];

            foreach ($collections as $collectionName) {
                try {
                    // Récupérer tous les documents de la collection via REST
                    $documents = $this->firebaseRest->getCollection($collectionName);
                    $deletedCount = 0;

                    foreach ($documents as $docId => $docData) {
                        // Ne pas supprimer le document placeholder _init
                        if ($docId === '_init') continue;
                        $this->firebaseRest->deleteDocument($collectionName, $docId);
                        $deletedCount++;
                    }

                    // Recréer un document placeholder pour que la collection persiste dans Firestore
                    $this->firebaseRest->saveDocument($collectionName, '_init', [
                        '_placeholder' => true,
                        'created_at' => now()->toISOString(),
                        'description' => 'Document placeholder pour maintenir la collection'
                    ]);

                    $results[$collectionName] = [
                        'success' => true,
                        'deleted_count' => $deletedCount
                    ];

                    Log::info("Firebase reset: {$deletedCount} documents supprimés de la collection '{$collectionName}' (placeholder _init recréé)");
                } catch (\Exception $e) {
                    $results[$collectionName] = [
                        'success' => false,
                        'error' => $e->getMessage()
                    ];
                    Log::error("Firebase reset: Erreur sur la collection '{$collectionName}': " . $e->getMessage());
                }
            }

            $allSuccess = collect($results)->every(fn($r) => $r['success']);
            $totalDeleted = collect($results)->sum('deleted_count');

            // Supprimer les utilisateurs Firebase Auth si demandé
            $authResult = null;
            if ($request->boolean('delete_auth_users')) {
                try {
                    $authResult = $this->firebaseRest->deleteAllAuthUsers();
                    if (!$authResult['success']) {
                        $allSuccess = false;
                    }
                } catch (\Exception $e) {
                    $authResult = [
                        'success' => false,
                        'error' => $e->getMessage(),
                        'deleted_count' => 0
                    ];
                    $allSuccess = false;
                    Log::error('Firebase Auth reset error: ' . $e->getMessage());
                }
            }

            $message = $allSuccess
                ? "Réinitialisation terminée : {$totalDeleted} documents supprimés"
                : 'Réinitialisation partielle : certaines opérations ont échoué';

            if ($authResult) {
                $message .= " | Auth: {$authResult['deleted_count']} utilisateur(s) supprimé(s)";
            }

            return response()->json([
                'success' => $allSuccess,
                'message' => $message,
                'data' => $results,
                'auth_result' => $authResult
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation des données Firebase',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Initialiser les collections Firebase avec un document placeholder _init
     * Utile après un reset qui a supprimé toutes les collections
     */
    public function initFirebaseCollections(Request $request): JsonResponse
    {
        try {
            $connectionTest = $this->firebaseRest->testConnection();
            if (!$connectionTest['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le service Firebase n\'est pas disponible'
                ], 503);
            }

            $collections = $request->input('collections', [
                'utilisateurs',
                'statut_utilisateurs',
                'signalements',
                'histo_statuts'
            ]);

            $results = [];
            foreach ($collections as $collectionName) {
                try {
                    $this->firebaseRest->saveDocument($collectionName, '_init', [
                        '_placeholder' => true,
                        'created_at' => now()->toISOString(),
                        'description' => 'Document placeholder pour maintenir la collection'
                    ]);
                    $results[$collectionName] = ['success' => true];
                    Log::info("Firebase init: collection '{$collectionName}' initialisée avec _init");
                } catch (\Exception $e) {
                    $results[$collectionName] = ['success' => false, 'error' => $e->getMessage()];
                    Log::error("Firebase init: erreur pour '{$collectionName}': " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => collect($results)->every(fn($r) => $r['success']),
                'message' => 'Initialisation des collections terminée',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'initialisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}