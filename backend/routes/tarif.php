<?php

use App\Http\Controllers\TarifController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tarif Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:api')->group(function () {
    Route::get('/tarifs', [TarifController::class, 'index']);
    Route::get('/tarifs/current', [TarifController::class, 'current']);
    Route::post('/tarifs', [TarifController::class, 'store']);
});
