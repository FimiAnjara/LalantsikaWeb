<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

Route::middleware('auth:api')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::post('/users/{id}/block', [UserController::class, 'block']);
    Route::post('/users/{id}/unblock', [UserController::class, 'unblock']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // User types and status endpoints
    Route::get('/user-types', [UserController::class, 'getTypesUtilisateurs']);
    // Ajoute ici le endpoint pour les statuts si besoin
    Route::get('/user-statuses', [UserController::class, 'getStatutsUtilisateurs']);
});
