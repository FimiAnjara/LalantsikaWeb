<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ParametreController;

/*
|--------------------------------------------------------------------------
| Parametre Routes
|--------------------------------------------------------------------------
|
| Routes protégées pour la gestion des paramètres
| Accessible uniquement aux utilisateurs authentifiés
|
*/

Route::middleware(['auth:api'])->group(function () {
    Route::prefix('parametres')->group(function () {
        Route::get('/', [ParametreController::class, 'index']);
        Route::post('/', [ParametreController::class, 'store']);
        Route::post('/sync', [ParametreController::class, 'sync']);
        Route::post('/reset-firebase', [ParametreController::class, 'resetFirebaseData']);
    });
});