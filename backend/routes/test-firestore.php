<?php

use Illuminate\Support\Facades\Route;
use App\Services\Firebase\FirestoreService;

Route::get('/test/firestore-connection', function () {
    $firestoreService = new FirestoreService();
    
    $logs = [];
    
    // Test 1 : Vérification de l'initialisation
    try {
        $reflection = new ReflectionClass($firestoreService);
        $property = $reflection->getProperty('isAvailable');
        $property->setAccessible(true);
        $isInitialized = $property->getValue($firestoreService);
        $logs[] = "Firestore initialized: " . ($isInitialized ? 'YES' : 'NO');
    } catch (\Exception $e) {
        $logs[] = "Error checking initialization: " . $e->getMessage();
    }
    
    // Test 2 : Vérification isAvailable()
    $logs[] = "Testing isAvailable()...";
    $isAvailable = $firestoreService->isAvailable();
    $logs[] = "isAvailable() result: " . ($isAvailable ? 'TRUE' : 'FALSE');
    
    // Test 3 : Tentative d'écriture
    if ($isAvailable) {
        try {
            $logs[] = "Testing write to Firestore...";
            $testData = [
                'test' => true,
                'timestamp' => now()->toIso8601String(),
                'message' => 'Test from Laravel'
            ];
            
            $result = $firestoreService->saveToCollection('_test_collection', 'test_doc', $testData);
            $logs[] = "Write test result: " . ($result ? 'SUCCESS' : 'FAILED');
            
            // Test 4 : Lecture
            if ($result) {
                $logs[] = "Testing read from Firestore...";
                $readData = $firestoreService->getFromCollection('_test_collection', 'test_doc');
                $logs[] = "Read test result: " . ($readData ? 'SUCCESS' : 'FAILED');
                $logs[] = "Read data: " . json_encode($readData);
            }
        } catch (\Exception $e) {
            $logs[] = "Error during write/read test: " . $e->getMessage();
            $logs[] = "Stack trace: " . $e->getTraceAsString();
        }
    }
    
    return response()->json([
        'firestore_available' => $isAvailable,
        'logs' => $logs,
        'service_account_exists' => file_exists(storage_path('app/firebase/service-account.json')),
        'service_account_path' => storage_path('app/firebase/service-account.json')
    ]);
});
