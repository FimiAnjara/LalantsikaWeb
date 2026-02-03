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
        Schema::create('image_signalement', function (Blueprint $table) {
            $table->id('id_image_signalement');
            $table->string('image', 350);
            $table->unsignedBigInteger('id_histo_statut');
            
            // Colonnes de synchronisation
            $table->boolean('synchronized')->default(false);
            $table->timestamp('last_sync_at')->nullable();
            
            $table->foreign('id_histo_statut')
                ->references('id_histo_statut')
                ->on('histo_statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('image_signalement');
    }
};