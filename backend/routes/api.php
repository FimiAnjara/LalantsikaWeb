<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SyncController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Routes de synchronisation Firebase
Route::prefix('sync')->group(function () {
    Route::get('/status', [SyncController::class, 'status']);
    Route::post('/utilisateurs', [SyncController::class, 'synchroniserUtilisateurs']);
    Route::post('/utilisateurs/{id}', [SyncController::class, 'synchroniserUtilisateur']);
    Route::post('/force', [SyncController::class, 'forceSync']);
});

require __DIR__.'/auth.php';
require __DIR__.'/sexe.php';
require __DIR__.'/utilisateur.php';
require __DIR__.'/signalement.php';
require __DIR__.'/entreprise.php';