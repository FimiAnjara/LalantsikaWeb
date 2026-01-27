<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\Sync\DatabaseSyncService;
use App\Models\User;
use App\Models\Entreprise;
use App\Models\Signalement;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ========================================
// 🔄 SYNCHRONISATION AUTOMATIQUE
// ========================================

/**
 * Synchroniser tous les modèles non synchronisés toutes les 5 minutes
 */
Schedule::call(function () {
    $syncService = app(DatabaseSyncService::class);
    
    // Synchroniser chaque modèle
    $models = [
        ['class' => User::class, 'collection' => 'utilisateurs'],
        ['class' => Entreprise::class, 'collection' => 'entreprises'],
        ['class' => Signalement::class, 'collection' => 'signalements'],
    ];
    
    foreach ($models as $model) {
        try {
            $result = $syncService->syncUnsynchronized($model['class'], $model['collection']);
            \Log::info("Auto-sync {$model['collection']}: {$result['synced']} synchronisés");
        } catch (\Exception $e) {
            \Log::error("Auto-sync failed for {$model['collection']}: " . $e->getMessage());
        }
    }
})->everyFiveMinutes()->name('auto-sync-firebase');

/**
 * Commande manuelle : php artisan sync:firebase
 */
Artisan::command('sync:firebase {model?}', function ($model = null) {
    $syncService = app(DatabaseSyncService::class);
    
    $models = [
        'utilisateurs' => ['class' => User::class, 'collection' => 'utilisateurs'],
        'entreprises' => ['class' => Entreprise::class, 'collection' => 'entreprises'],
        'signalements' => ['class' => Signalement::class, 'collection' => 'signalements'],
    ];
    
    if ($model && isset($models[$model])) {
        $config = $models[$model];
        $result = $syncService->syncUnsynchronized($config['class'], $config['collection']);
        
        if (!$result['success']) {
            $this->error("❌ {$config['collection']}: {$result['message']}");
        } else {
            $this->info("✅ {$config['collection']}: {$result['synced']} synchronisés, {$result['failed']} échoués");
        }
    } else {
        foreach ($models as $config) {
            $result = $syncService->syncUnsynchronized($config['class'], $config['collection']);
            
            if (!$result['success']) {
                $this->error("❌ {$config['collection']}: {$result['message']}");
            } else {
                $this->info("✅ {$config['collection']}: {$result['synced']} synchronisés, {$result['failed']} échoués");
            }
        }
    }
})->purpose('Synchroniser Firebase manuellement');
