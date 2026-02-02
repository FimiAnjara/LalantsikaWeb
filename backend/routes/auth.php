<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Services\Firebase\FirebaseRestService;
use App\Models\User;

Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('firebase', [AuthController::class, 'firebaseAuth']);
    
    Route::middleware('auth:api')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Route de test (sans auth) pour vérifier Firestore REST API
Route::get('test/firebase', function () {
    $startTime = microtime(true);
    
    try {
        $projectId = config('firebase.project_id');
        $apiKey = config('firebase.api_key');
        
        $firebaseService = app(FirebaseRestService::class);
        $testResult = $firebaseService->testConnection();
        
        $testResults = [
            'project_id' => $projectId,
            'api_key_configured' => !empty($apiKey),
            'api_key_preview' => $apiKey ? substr($apiKey, 0, 10) . '...' : null,
            'firestore_url' => $firebaseService->getDatabaseUrl(),
            'method' => 'Firestore REST API (no gRPC required)',
            'connection_test' => $testResult,
        ];
        
        return response()->json([
            'code' => 200,
            'success' => $testResult['success'] ?? false,
            'message' => $testResult['success'] ? 'Firestore REST API connected successfully' : 'Firestore connection failed',
            'data' => $testResults,
            'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2)
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'code' => 500,
            'success' => false,
            'message' => $e->getMessage(),
            'data' => [
                'error_type' => get_class($e),
                'file' => basename($e->getFile()),
                'line' => $e->getLine()
            ],
            'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2)
        ]);
    }
});
