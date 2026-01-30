<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SignalementController;

/*
|--------------------------------------------------------------------------
| Routes pour les signalements
|--------------------------------------------------------------------------
*/

Route::middleware('auth:api')->group(function () {
    // Liste des signalements
    Route::get('/signalements', [SignalementController::class, 'index']);
    
    // Détails d'un signalement
    Route::get('/signalements/{id}', [SignalementController::class, 'show']);
    
    // Mise à jour du statut d'un signalement
    Route::put('/signalements/{id}/statut', [SignalementController::class, 'updateStatut']);
    
    // Suppression d'un signalement
    Route::delete('/signalements/{id}', [SignalementController::class, 'destroy']);
    
    // Liste des statuts disponibles
    Route::get('/statuts', [SignalementController::class, 'getStatuts']);
});
