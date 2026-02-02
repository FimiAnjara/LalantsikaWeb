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
        Schema::table('signalement', function (Blueprint $table) {
            $table->unsignedBigInteger('id_statut')->nullable()->after('id_utilisateur');
            $table->foreign('id_statut')->references('id_statut')->on('statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('signalement', function (Blueprint $table) {
            $table->dropForeign(['id_statut']);
            $table->dropColumn('id_statut');
        });
    }
};
