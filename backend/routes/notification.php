<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NotificationController;

/*
|--------------------------------------------------------------------------
| Notification Routes
|--------------------------------------------------------------------------
|
| Routes pour la gestion des notifications push via FCM
|
*/

Route::prefix('notifications')->group(function () {
    // Route publique pour vérifier le statut du service
    Route::get('/status', [NotificationController::class, 'status']);
    
    // Routes protégées par authentification
    Route::middleware('auth:api')->group(function () {
        // Envoyer une notification à un utilisateur
        Route::post('/send', [NotificationController::class, 'send']);
        
        // Envoyer une notification à plusieurs utilisateurs
        Route::post('/send-multiple', [NotificationController::class, 'sendMultiple']);
        
        // Envoyer une notification directement à un token (pour test)
        Route::post('/send-to-token', [NotificationController::class, 'sendToToken']);
        
        // Mettre à jour le token FCM d'un utilisateur
        Route::post('/update-token', [NotificationController::class, 'updateToken']);
    });
});
