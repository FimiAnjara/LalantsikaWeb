<?php

use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes pour l'upload d'images vers Firebase Storage
|--------------------------------------------------------------------------
*/

Route::prefix('upload')->group(function () {
    Route::post('/image', [UploadController::class, 'uploadImage']);
    Route::post('/base64', [UploadController::class, 'uploadBase64']);
    Route::delete('/delete', [UploadController::class, 'deleteImage']);
});
