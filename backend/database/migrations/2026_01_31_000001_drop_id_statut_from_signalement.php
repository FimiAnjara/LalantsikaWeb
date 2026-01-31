<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('signalement', function (Blueprint $table) {
            if (Schema::hasColumn('signalement', 'id_statut')) {
                $table->dropColumn('id_statut');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('signalement', function (Blueprint $table) {
            $table->unsignedBigInteger('id_statut')->nullable();
            // Ajoute la contrainte si besoin
            // $table->foreign('id_statut')->references('id_statut')->on('statut');
        });
    }
};
