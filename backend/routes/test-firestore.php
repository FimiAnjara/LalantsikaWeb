<?php

use Illuminate\Support\Facades\Route;
use App\Services\Firebase\FirebaseRestService;

Route::get('/test/firestore-connection', function () {
    $firebaseService = app(FirebaseRestService::class);
    
    $logs = [];
    
    // Test 1 : Vérification de la connexion
    $logs[] = "Testing Firebase REST API connection...";
    $isAvailable = $firebaseService->testConnection();
    $logs[] = "Connection test result: " . ($isAvailable ? 'TRUE' : 'FALSE');
    
    // Test 2 : Tentative d'écriture
    if ($isAvailable) {
        try {
            $logs[] = "Testing write to Firebase...";
            $testData = [
                'test' => true,
                'timestamp' => now()->toIso8601String(),
                'message' => 'Test from Laravel REST API'
            ];
            
            $result = $firebaseService->saveDocument('_test_collection', 'test_doc', $testData);
            $logs[] = "Write test result: " . ($result ? 'SUCCESS' : 'FAILED');
            
            // Test 3 : Lecture
            if ($result) {
                $logs[] = "Testing read from Firebase...";
                $readData = $firebaseService->getDocument('_test_collection', 'test_doc');
                $logs[] = "Read test result: " . ($readData ? 'SUCCESS' : 'FAILED');
                $logs[] = "Read data: " . json_encode($readData);
            }
        } catch (\Exception $e) {
            $logs[] = "Error during write/read test: " . $e->getMessage();
        }
    }
    
    return response()->json([
        'firebase_available' => $isAvailable,
        'logs' => $logs,
        'database_url' => config('firebase.database_url'),
        'method' => 'REST API (no gRPC required)'
    ]);
});
