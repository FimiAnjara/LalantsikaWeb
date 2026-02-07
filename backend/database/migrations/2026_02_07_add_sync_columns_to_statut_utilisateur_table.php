<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('statut_utilisateur', function (Blueprint $table) {
            // Ajouter les colonnes de synchronisation si elles n'existent pas
            if (!Schema::hasColumn('statut_utilisateur', 'synchronized')) {
                $table->boolean('synchronized')->default(false)->after('etat');
            }
            
            if (!Schema::hasColumn('statut_utilisateur', 'last_sync_at')) {
                $table->timestamp('last_sync_at')->nullable()->after('synchronized');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('statut_utilisateur', function (Blueprint $table) {
            $table->dropColumn(['synchronized', 'last_sync_at']);
        });
    }
};
