<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\StorageController;

/**
 * Routes pour servir les fichiers du stockage
 * Accessible publiquement sans authentification
 */

Route::get('/storage/{path}', [StorageController::class, 'serve'])
    ->where('path', '.*')
    ->name('storage.serve');

/**
 * Routes protégées pour upload/delete de photos
 * Nécessite authentification JWT
 */
Route::middleware('auth:api')->group(function () {
    // Upload une photo utilisateur
    Route::post('/storage/upload/user-photo', [StorageController::class, 'uploadUserPhoto']);
    
    // Supprimer une photo utilisateur
    Route::delete('/storage/utilisateur/{filename}', [StorageController::class, 'deleteUserPhoto']);
    
    // Test endpoint
    Route::get('/storage/test', function () {
        return response()->json(['message' => 'Authentifié avec succès', 'user' => auth('api')->user()]);
    });
});
