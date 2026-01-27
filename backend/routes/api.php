<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Services\SyncService;
use App\Services\FirestoreService;

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
    // Vérifier la connexion Firestore
    Route::get('sync/check', function () {
        $syncService = new SyncService(new FirestoreService());
        return response()->json($syncService->checkConnection());
    });

    // Synchroniser tous les utilisateurs non synchronisés
    Route::post('sync/users', function () {
        $syncService = new SyncService(new FirestoreService());
        $results = $syncService->syncUnsynchronizedUsers();
        return response()->json([
            'success' => true,
            'results' => $results
        ]);
    });

    // Forcer la synchronisation d'un utilisateur spécifique
    Route::post('sync/user/{id}', function ($id) {
        $user = \App\Models\User::findOrFail($id);
        $syncService = new SyncService(new FirestoreService());
        $synced = $syncService->forceSyncUser($user);
        
        return response()->json([
            'success' => $synced,
            'message' => $synced 
                ? 'User synchronized successfully' 
                : 'Failed to synchronize user'
        ]);
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
        $testResults['message'] = $isAvailable ? 'Firebase connected!' : 'Firebase not available';
        
        return response()->json($testResults);
    } catch (\Exception $e) {
        return response()->json([
            'firebase_available' => false,
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => explode("\n", $e->getTraceAsString())
        ], 500);
    }
});
