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

// Route de test (sans auth) pour vérifier Firebase REST API
Route::get('test/firebase', function () {
    $startTime = microtime(true);
    
    try {
        $databaseUrl = config('firebase.database_url');
        
        $testResults = [
            'database_url' => $databaseUrl,
            'database_url_configured' => !empty($databaseUrl),
            'method' => 'REST API (no gRPC required)',
        ];
        
        if (empty($databaseUrl)) {
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'FIREBASE_DATABASE_URL not configured in .env',
                'data' => $testResults,
                'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2)
            ]);
        }
        
        $firebaseService = app(FirebaseRestService::class);
        $isAvailable = $firebaseService->testConnection();
        
        $testResults['firebase_available'] = $isAvailable;
        
        return response()->json([
            'code' => 200,
            'success' => $isAvailable,
            'message' => $isAvailable ? 'Firebase REST API connected successfully' : 'Firebase connection failed',
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
