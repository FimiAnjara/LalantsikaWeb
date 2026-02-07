<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\StatutUtilisateur;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Routes de test pour le register
 */

Route::post('/test-register-simple', function (Request $request) {
    Log::info('====== TEST REGISTER SIMPLE ======');
    Log::info('All request data:', $request->all());
    Log::info('Has photo_path:', $request->filled('photo_path'));
    Log::info('Photo path value:', $request->input('photo_path'));
    
    try {
        $photoUrl = null;
        
        if ($request->filled('photo_path')) {
            $photoUrl = $request->input('photo_path');
            Log::info("✅ Photo path received: {$photoUrl}");
        } else {
            Log::warning("❌ No photo_path in request");
        }
        
        // Créer l'utilisateur
        $user = User::create([
            'identifiant' => 'testuser_' . time(),
            'mdp' => Hash::make('password'),
            'nom' => 'Test',
            'prenom' => 'User',
            'dtn' => '2000-01-01',
            'email' => 'test_' . time() . '@example.com',
            'photo_url' => $photoUrl,
            'id_sexe' => 1,
            'id_type_utilisateur' => 2,
        ]);
        
        Log::info("✅ User created", [
            'id' => $user->id_utilisateur,
            'email' => $user->email,
            'photo_url' => $user->photo_url,
        ]);
        
        // Créer le statut
        StatutUtilisateur::create([
            'id_utilisateur' => $user->id_utilisateur,
            'etat' => 1,
            'date_' => now(),
        ]);
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id_utilisateur,
                'email' => $user->email,
                'photo_url' => $user->photo_url,
            ]
        ]);
    } catch (\Exception $e) {
        Log::error('Error: ' . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
});
