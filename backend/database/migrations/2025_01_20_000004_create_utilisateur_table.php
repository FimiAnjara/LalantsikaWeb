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
            $table->string('mdp', 250);
            $table->string('nom', 50);
            $table->string('prenom', 50);
            $table->date('dtn');
            $table->string('email', 50)->nullable();
            $table->string('photo_url', 500)->nullable();
            $table->string('firebase_uid', 128)->nullable()->unique();
            $table->unsignedBigInteger('id_sexe');
            $table->unsignedBigInteger('id_type_utilisateur');
            
            // Colonnes de synchronisation
            $table->boolean('synchronized')->default(false);
            $table->timestamp('last_sync_at')->nullable();
            
            // Soft deletes
            $table->softDeletes();
            
            $table->foreign('id_sexe')
                ->references('id_sexe')
                ->on('sexe');
            
            $table->foreign('id_type_utilisateur')
                ->references('id_type_utilisateur')
                ->on('type_utilisateur');
        });
        DB::statement('ALTER TABLE utilisateur ADD COLUMN fcm_token VARCHAR(500) NULL');

    }   

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('utilisateur');
    }
};
