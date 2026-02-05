<?php

use App\Http\Controllers\SyncController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Synchronisation Routes
|--------------------------------------------------------------------------
|
| Routes pour la synchronisation des données vers Firebase
|
*/

Route::prefix('sync')->group(function () {
    // Synchroniser tous les utilisateurs non synchronisés
    Route::post('/utilisateurs', [SyncController::class, 'synchroniserUtilisateurs']);
    
    // Synchroniser un utilisateur spécifique
    Route::post('/utilisateurs/{id}', [SyncController::class, 'synchroniserUtilisateur']);
    
    // Obtenir le statut de synchronisation
    Route::get('/status', [SyncController::class, 'status']);
    
    // Forcer la re-synchronisation
    Route::post('/force', [SyncController::class, 'forceSync']);
    
    // Vérifier l'état des utilisateurs Firebase
    Route::get('/firebase-users', [SyncController::class, 'checkFirebaseUsers']);
});
