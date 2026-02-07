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
    
    // Synchroniser uniquement les signalements depuis Firebase
    Route::post('/signalements/from-firebase', [SyncController::class, 'syncSignalementsFromFirebase']);
    
    // Synchroniser uniquement les histo_statuts depuis Firebase
    Route::post('/histo-statuts/from-firebase', [SyncController::class, 'syncHistoStatutsFromFirebase']);
    
    // Synchroniser les statuts utilisateurs de Firebase vers PostgreSQL
    Route::post('/statut-utilisateurs/from-firebase', [SyncController::class, 'syncStatutUtilisateursFromFirebase']);

    // Synchroniser les statuts utilisateurs modifiés de PostgreSQL vers Firebase
    Route::post('/statut-utilisateurs/to-firebase', [SyncController::class, 'syncStatutUtilisateuresToFirebase']);
    
    // Synchroniser les utilisateurs modifiés de PostgreSQL vers Firebase
    Route::post('/utilisateurs/modified/to-firebase', [SyncController::class, 'syncModifiedUsersToFirebase']);
    
    // Synchroniser les histo_statuts de PostgreSQL vers Firebase
    Route::post('/histo-statuts/to-firebase', [SyncController::class, 'syncHistoStatutsToFirebase']);

    // Synchroniser les paramètres de PostgreSQL vers Firebase
    Route::post('/parametres/to-firebase', [SyncController::class, 'syncParametresToFirebase']);

    // =============================================
    // Statuts de synchronisation
    // =============================================
    
    // Obtenir le statut de synchronisation PostgreSQL -> Firebase
    Route::get('/status', [SyncController::class, 'status']);

    // Obtenir le statut de synchronisation des paramètres
    Route::get('/parametres/status', [SyncController::class, 'parametreStatus']);
    
    // Obtenir le statut de synchronisation Firebase -> PostgreSQL
    Route::get('/firebase-status', [SyncController::class, 'firebaseStatus']);
    
    // Obtenir le statut de synchronisation des statuts utilisateurs
    Route::get('/statut-utilisateurs/status', [SyncController::class, 'statutUtilisateurStatus']);
    Route::get('/statut-utilisateurs/to-firebase/status', [SyncController::class, 'statutUtilisateurToFirebaseStatus']);
    
    // Vérifier l'état des utilisateurs Firebase
    Route::get('/firebase-users', [SyncController::class, 'checkFirebaseUsers']);
});
