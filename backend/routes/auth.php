<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Services\Sync\DatabaseSyncService;
use App\Services\Firebase\FirestoreService;
use App\Models\User;

Route::group(['prefix' => 'auth'], function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('firebase', [AuthController::class, 'firebaseAuth']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Routes de synchronisation (protégées par auth)
Route::middleware('auth:api')->group(function () {

    Route::get('sync/status', function () {
        try {
            $syncService = app(DatabaseSyncService::class);
            $status = $syncService->getStatus();
            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Sync status retrieved successfully',
                'data' => $status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ]);
        }
    });

    // Synchroniser tous les utilisateurs non synchronisés
    Route::post('sync/users', function () {
        try {
            $syncService = app(DatabaseSyncService::class);
            $results = $syncService->syncUnsynchronized(User::class, 'utilisateurs');
            return response()->json([
                'code' => 200,
                'success' => $results['success'],
                'message' => 'Users synchronized successfully',
                'data' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ]);
        }
    });

    // Forcer la synchronisation d'un utilisateur spécifique 
    Route::post('sync/user/{id}', function ($id) {
        try {
            $user = User::findOrFail($id);  
            $firestoreService = app(FirestoreService::class);
            
            if (!$firestoreService->isAvailable()) {
                return response()->json([
                    'code' => 503,
                    'success' => false,
                    'message' => 'Firebase is unavailable',
                    'data' => null
                ]);
            }

            // Synchroniser manuellement
            $userData = $user->toArray();
            unset($userData['mdp']);
            
            $synced = $firestoreService->saveToCollection('utilisateurs', $user->id_utilisateur, $userData);
            
            if ($synced) {
                $user->update(['synchronized' => true, 'last_sync_at' => now()]);
            }

            $httpCode = $synced ? 200 : 400;
            return response()->json([
                'code' => $httpCode,
                'success' => $synced,
                'message' => $synced ? 'User synchronized successfully' : 'Failed to synchronize user',
                'data' => $user->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ], 500);
        }
    });
});

// Route de test (sans auth) pour vérifier Firebase
Route::get('test/firebase', function () {
    try {
        $firestore = new FirestoreService();
        
        // Test détaillé
        $testResults = [
            'service_account_exists' => file_exists(storage_path('app/firebase/service-account.json')),
            'service_account_path' => storage_path('app/firebase/service-account.json'),
            'service_account_readable' => is_readable(storage_path('app/firebase/service-account.json')),
        ];
        
        // Lire le project_id
        $serviceAccount = json_decode(file_get_contents(storage_path('app/firebase/service-account.json')), true);
        $testResults['project_id'] = $serviceAccount['project_id'] ?? 'NOT_FOUND';
        
        // Tester la disponibilité
        $isAvailable = $firestore->isAvailable();
        $testResults['firebase_available'] = $isAvailable;
        
        return response()->json([
            'code' => 200,
            'success' => $isAvailable,
            'message' => $isAvailable ? 'Firebase connected successfully' : 'Firebase is not available',
            'data' => $testResults
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'code' => 500,
            'success' => false,
            'message' => $e->getMessage(),
            'data' => [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => explode("\n", $e->getTraceAsString())
            ]
        ]);
    }
});
