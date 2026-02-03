<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EntrepriseController;

// Route publique pour lister les entreprises
Route::get('/companies', [EntrepriseController::class, 'index']);

Route::middleware('auth:api')->group(function () {
    Route::post('/companies', [EntrepriseController::class, 'store']);
    Route::put('/companies/{id}', [EntrepriseController::class, 'update']);
    Route::delete('/companies/{id}', [EntrepriseController::class, 'destroy']);
});
