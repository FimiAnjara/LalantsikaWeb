<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SexeController;

Route::middleware('auth:api')->group(function () {
    Route::get('sexs', [SexeController::class, 'index']);
});
Route::get('sexes', [SexeController::class, 'index']);
