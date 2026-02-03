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
        Schema::create('histo_statut', function (Blueprint $table) {
            $table->id('id_histo_statut');
            $table->timestamp('daty')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('id_statut');
            $table->unsignedBigInteger('id_signalement');
            
            // Colonnes de synchronisation
            $table->boolean('synchronized')->default(false);
            $table->timestamp('last_sync_at')->nullable();
            
            $table->foreign('id_statut')
                ->references('id_statut')
                ->on('statut');
            
            $table->foreign('id_signalement')
                ->references('id_signalement')
                ->on('signalement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('histo_statut');
    }
};
