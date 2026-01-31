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
        Schema::create('signalement', function (Blueprint $table) {
            $table->id('id_signalement');
            $table->timestamp('daty')->nullable();
            $table->decimal('surface', 15, 2)->nullable();
            $table->decimal('budget', 15, 2)->nullable();
            $table->text('description')->nullable();
            $table->string('photo', 150)->nullable();
            $table->unsignedBigInteger('id_entreprise')->nullable();
            $table->unsignedBigInteger('id_utilisateur');
            $table->geography('point', 4326)->nullable();

            $table->foreign('id_entreprise')
                ->references('id_entreprise')
                ->on('entreprise');

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
        Schema::dropIfExists('signalement');
    }
};
