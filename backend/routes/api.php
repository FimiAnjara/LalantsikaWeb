<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SyncController;
use App\Services\Firebase\FirebaseRestService;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Routes de synchronisation Firebase
Route::prefix('sync')->group(function () {
    Route::get('/status', [SyncController::class, 'status']);
    Route::get('/check-users', [SyncController::class, 'checkFirebaseUsers']);
    Route::post('/utilisateurs', [SyncController::class, 'synchroniserUtilisateurs']);
    Route::post('/utilisateurs/{id}', [SyncController::class, 'synchroniserUtilisateur']);
    Route::post('/force', [SyncController::class, 'forceSync']);
});

// Routes Firebase - Lecture des données
Route::prefix('firebase')->group(function () {
    
    // Récupérer tous les utilisateurs depuis Firebase
    Route::get('/utilisateurs', function () {
        try {
            $firebaseService = app(FirebaseRestService::class);
            $utilisateurs = $firebaseService->getCollection('utilisateurs');
            
            return response()->json([
                'success' => true,
                'message' => 'Utilisateurs récupérés depuis Firebase',
                'data' => [
                    'count' => count($utilisateurs),
                    'utilisateurs' => $utilisateurs
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    });
    
    // Récupérer un utilisateur spécifique depuis Firebase
    Route::get('/utilisateurs/{id}', function ($id) {
        try {
            $firebaseService = app(FirebaseRestService::class);
            $utilisateur = $firebaseService->getDocument('utilisateurs', $id);
            
            if (!$utilisateur) {
                return response()->json([
                    'success' => false,
                    'message' => "Utilisateur {$id} non trouvé dans Firebase"
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Utilisateur récupéré depuis Firebase',
                'data' => $utilisateur
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage()
            ], 500);
        }
    });
    
    // Comparer les utilisateurs PostgreSQL vs Firebase
    Route::get('/compare', function () {
        try {
            $firebaseService = app(FirebaseRestService::class);
            
            // Utilisateurs PostgreSQL
            $pgUsers = \App\Models\User::select('id_utilisateur', 'email', 'nom', 'prenom', 'synchronized')
                ->get()
                ->keyBy('id_utilisateur')
                ->toArray();
            
            // Utilisateurs Firebase
            $fbUsers = $firebaseService->getCollection('utilisateurs');
            
            $comparison = [
                'postgresql_count' => count($pgUsers),
                'firebase_count' => count($fbUsers),
                'in_pg_only' => [],
                'in_firebase_only' => [],
                'in_both' => []
            ];
            
            // Vérifier les utilisateurs PostgreSQL
            foreach ($pgUsers as $id => $user) {
                if (isset($fbUsers[$id])) {
                    $comparison['in_both'][] = $id;
                } else {
                    $comparison['in_pg_only'][] = $id;
                }
            }
            
            // Vérifier les utilisateurs Firebase non présents dans PostgreSQL
            foreach ($fbUsers as $id => $user) {
                if (!isset($pgUsers[$id])) {
                    $comparison['in_firebase_only'][] = $id;
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Comparaison PostgreSQL vs Firebase',
                'data' => $comparison
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la comparaison',
                'error' => $e->getMessage()
            ], 500);
        }
    });

    /**
     * Créer un utilisateur dans Firebase Auth (pour migration des utilisateurs existants)
     * POST /api/firebase/create-auth-user
     * Body: { "email": "...", "password": "..." }
     */
    Route::post('/create-auth-user', function (\Illuminate\Http\Request $request) {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|min:6'
            ]);

            $firebaseService = app(FirebaseRestService::class);
            
            // Créer l'utilisateur dans Firebase Auth
            $result = $firebaseService->createAuthUser($request->email, $request->password);
            
            if ($result) {
                // Mettre à jour le firebase_uid dans PostgreSQL
                $user = \App\Models\User::where('email', $request->email)->first();
                if ($user) {
                    $user->firebase_uid = $result['uid'];
                    $user->save();
                    
                    // Mettre à jour dans Firestore aussi
                    $firebaseService->saveDocument(
                        'utilisateurs',
                        (string) $user->id_utilisateur,
                        [
                            'firebase_uid' => $result['uid'],
                            'uid' => $result['uid'],
                            'updatedAt' => now()->toIso8601String()
                        ]
                    );
                }
                
                return response()->json([
                    'success' => true,
                    'message' => 'Utilisateur créé dans Firebase Auth',
                    'data' => [
                        'uid' => $result['uid'],
                        'email' => $result['email']
                    ]
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Email déjà existant ou erreur lors de la création'
            ], 400);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    });

    /**
     * Créer tous les utilisateurs existants dans Firebase Auth (migration batch)
     * POST /api/firebase/migrate-all-users
     * Body: { "default_password": "password123" }
     * 
     * ATTENTION: Tous les utilisateurs auront le même mot de passe temporaire !
     */
    Route::post('/migrate-all-users', function (\Illuminate\Http\Request $request) {
        try {
            $request->validate([
                'default_password' => 'required|min:6'
            ]);

            $firebaseService = app(FirebaseRestService::class);
            $users = \App\Models\User::whereNull('firebase_uid')
                ->orWhere('firebase_uid', 'like', 'user_%')
                ->get();
            
            $results = [
                'total' => $users->count(),
                'created' => 0,
                'already_exists' => 0,
                'errors' => []
            ];
            
            foreach ($users as $user) {
                try {
                    $authResult = $firebaseService->createAuthUser($user->email, $request->default_password);
                    
                    if ($authResult) {
                        $user->firebase_uid = $authResult['uid'];
                        $user->save();
                        
                        // Mettre à jour dans Firestore
                        $firebaseService->saveDocument(
                            'utilisateurs',
                            (string) $user->id_utilisateur,
                            [
                                'firebase_uid' => $authResult['uid'],
                                'uid' => $authResult['uid'],
                                'updatedAt' => now()->toIso8601String()
                            ]
                        );
                        
                        $results['created']++;
                    } else {
                        $results['already_exists']++;
                    }
                } catch (\Exception $e) {
                    $results['errors'][] = [
                        'email' => $user->email,
                        'error' => $e->getMessage()
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Migration terminée',
                'data' => $results
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    });
});

require __DIR__.'/auth.php';
require __DIR__.'/sexe.php';
require __DIR__.'/utilisateur.php';
require __DIR__.'/signalement.php';
require __DIR__.'/entreprise.php';