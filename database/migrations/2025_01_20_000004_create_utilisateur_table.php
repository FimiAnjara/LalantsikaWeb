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
        Schema::create('utilisateur', function (Blueprint $table) {
            $table->id('id_utilisateur');
            $table->string('identifiant', 50)->unique();
            $table->string('mdp', 50);
            $table->unsignedBigInteger('id_type_utilisateur');
            $table->timestamps();
            
            $table->foreign('id_type_utilisateur')
                ->references('id_type_utilisateur')
                ->on('type_utilisateur');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('utilisateur');
    }
};
