<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:api');

require __DIR__.'/auth.php';
require __DIR__.'/sexe.php';
require __DIR__.'/utilisateur.php';
require __DIR__.'/signalement.php';
require __DIR__.'/entreprise.php';
require __DIR__.'/upload.php';
require __DIR__.'/sync.php';
require __DIR__.'/notification.php';
require __DIR__.'/parametre.php';
require __DIR__.'/storage.php';
require __DIR__.'/debug.php';
require __DIR__.'/test-register.php';
require __DIR__.'/tarif.php';
