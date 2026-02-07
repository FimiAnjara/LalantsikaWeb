<?php

use Illuminate\Support\Facades\Route;
use App\Services\Firebase\FirebaseRestService;

Route::get('/test/firebase-rest', function () {
    $firebaseService = new FirebaseRestService();
    
    $logs = [];
    
    try {
        // Test 1 : Vérifier les config
        $projectId = config('firebase.project_id');
        $apiKey = config('firebase.api_key');
        
        $logs[] = "=== Firebase REST Configuration ===";
        $logs[] = "Project ID: " . $projectId;
        $logs[] = "API Key configured: " . (empty($apiKey) ? 'NO ❌' : 'YES ✅');
        if (!empty($apiKey)) {
            $logs[] = "API Key preview: " . substr($apiKey, 0, 20) . '...';
        }
        
        // Test 2 : Test de connexion
        $logs[] = "";
        $logs[] = "=== Testing Firestore Connection ===";
        $testResult = $firebaseService->testConnection();
        $logs[] = json_encode($testResult, JSON_PRETTY_PRINT);
        
        // Test 3 : Essayer de récupérer une collection
        if (!empty($apiKey)) {
            $logs[] = "";
            $logs[] = "=== Testing getCollection('utilisateurs') ===";
            try {
                $utilisateurs = $firebaseService->getCollection('utilisateurs');
                $logs[] = "✅ Success! Found " . count($utilisateurs) . " documents";
            } catch (\Exception $e) {
                $logs[] = "❌ Error: " . $e->getMessage();
            }
        }
        
    } catch (\Exception $e) {
        $logs[] = "ERROR: " . $e->getMessage();
        $logs[] = "Stack: " . $e->getTraceAsString();
    }
    
    return response()->json([
        'logs' => $logs
    ])->header('Content-Type', 'application/json');
});
