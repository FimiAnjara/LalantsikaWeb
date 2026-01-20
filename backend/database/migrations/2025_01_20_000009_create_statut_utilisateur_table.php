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
        Schema::create('statut_utilisateur', function (Blueprint $table) {
            $table->id('id_statut_utilisateur');
            $table->timestamp('date_');
            $table->integer('etat');
            $table->unsignedBigInteger('id_utilisateur');
            
            $table->foreign('id_utilisateur')
                ->references('id_utilisateur')
                ->on('utilisateur');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('statut_utilisateur');
    }
};
