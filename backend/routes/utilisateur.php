<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

Route::middleware('auth:api')->group(function () {
    Route::get('/utilisateurs', [UserController::class, 'index']);
    Route::get('/utilisateurs/{id}', [UserController::class, 'show']);
    Route::put('/utilisateurs/{id}', [UserController::class, 'update']);
    Route::post('/utilisateurs/{id}/bloquer', [UserController::class, 'block']);
    Route::post('/utilisateurs/{id}/debloquer', [UserController::class, 'unblock']);
    Route::delete('/utilisateurs/{id}', [UserController::class, 'destroy']);
    
    // Routes pour les types d'utilisateurs
    Route::get('/types-utilisateurs', [UserController::class, 'getTypesUtilisateurs']);
});
