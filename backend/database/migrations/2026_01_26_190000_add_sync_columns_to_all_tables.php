<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajouter les colonnes de synchronisation à TOUTES les tables
     */
    public function up(): void
    {
        $tables = [
            'entreprise',
            'signalement',
            'utilisateur',
            'point',
            'parametre',
            'histo_statut'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    if (!Schema::hasColumn($table->getTable(), 'synchronized')) {
                        $table->boolean('synchronized')->default(false);
                    }
                    if (!Schema::hasColumn($table->getTable(), 'last_sync_at')) {
                        $table->timestamp('last_sync_at')->nullable();
                    }
                });
            }
        }
    }

    /**
     * Supprimer les colonnes de synchronisation
     */
    public function down(): void
    {
        $tables = [
            'entreprise',
            'signalement',
            'point',
            'parametre',
            'histo_statut'
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropColumn(['synchronized', 'last_sync_at']);
                });
            }
        }
    }
};
