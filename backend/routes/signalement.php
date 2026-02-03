<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SignalementController;

/*
|--------------------------------------------------------------------------
| Routes pour les signalements
|--------------------------------------------------------------------------
*/

// Routes publiques (sans authentification)
Route::get('/reports', [SignalementController::class, 'index']);
Route::get('/reports/{id}', [SignalementController::class, 'show']);
Route::get('/statuses', [SignalementController::class, 'getStatuts']);

// Routes protégées (avec authentification)
Route::middleware('auth:api')->group(function () {
    // Ajouter un historique de statut (histostatut)
    Route::post('/reports/{id}/histostatut', [SignalementController::class, 'addHistoStatut']);
    // Récupérer l'historique des statuts d'un signalement
    Route::get('/reports/{id}/histostatut', [SignalementController::class, 'getHistoStatuts']);

    // Update report (budget, entreprise, etc.)
    Route::match(['put', 'patch'], '/reports/{id}', [SignalementController::class, 'update']);

    // Update report status
    Route::put('/reports/{id}/status', [SignalementController::class, 'updateStatut']);

    // Delete a report
    Route::delete('/reports/{id}', [SignalementController::class, 'destroy']);
});
