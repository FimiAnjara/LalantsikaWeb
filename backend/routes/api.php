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
});

require __DIR__.'/auth.php';
require __DIR__.'/sexe.php';
require __DIR__.'/utilisateur.php';
require __DIR__.'/signalement.php';
require __DIR__.'/entreprise.php';