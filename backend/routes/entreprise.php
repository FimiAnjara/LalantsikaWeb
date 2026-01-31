<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EntrepriseController;

Route::middleware('auth:api')->group(function () {
    Route::get('/companies', [EntrepriseController::class, 'index']);
});
