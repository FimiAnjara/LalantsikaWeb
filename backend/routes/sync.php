<?php

use App\Http\Controllers\SyncController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Synchronisation Routes
|--------------------------------------------------------------------------
|
| Routes pour la synchronisation des données vers/depuis Firebase
|
*/

Route::prefix('sync')->group(function () {
    // =============================================
    // PostgreSQL -> Firebase (envoi vers Firebase)
    // =============================================
    
    // Synchroniser tous les utilisateurs non synchronisés
    Route::post('/utilisateurs', [SyncController::class, 'synchroniserUtilisateurs']);
    
    // Synchroniser un utilisateur spécifique
    Route::post('/utilisateurs/{id}', [SyncController::class, 'synchroniserUtilisateur']);
    
    // Forcer la re-synchronisation
    Route::post('/force', [SyncController::class, 'forceSync']);
    
    // =============================================
    // Firebase -> PostgreSQL (récupération depuis Firebase)
    // =============================================
    
    // Synchroniser tous les signalements et histo_statuts depuis Firebase
    Route::post('/from-firebase', [SyncController::class, 'syncAllFromFirebase']);
    
    // Synchroniser les FCM tokens depuis Firebase
    Route::post('/fcm-tokens/from-firebase', [SyncController::class, 'syncFcmTokensFromFirebase']);
    
    // Synchroniser uniquement les signalements depuis Firebase
    Route::post('/signalements/from-firebase', [SyncController::class, 'syncSignalementsFromFirebase']);
    
    // Synchroniser uniquement les histo_statuts depuis Firebase
    Route::post('/histo-statuts/from-firebase', [SyncController::class, 'syncHistoStatutsFromFirebase']);
    
    // Synchroniser les histo_statuts de PostgreSQL vers Firebase
    Route::post('/histo-statuts/to-firebase', [SyncController::class, 'syncHistoStatutsToFirebase']);
    
    // =============================================
    // Statuts de synchronisation
    // =============================================
    
    // Obtenir le statut de synchronisation PostgreSQL -> Firebase
    Route::get('/status', [SyncController::class, 'status']);
    
    // Obtenir le statut de synchronisation Firebase -> PostgreSQL
    Route::get('/firebase-status', [SyncController::class, 'firebaseStatus']);
    
    // Vérifier l'état des utilisateurs Firebase
    Route::get('/firebase-users', [SyncController::class, 'checkFirebaseUsers']);
});
