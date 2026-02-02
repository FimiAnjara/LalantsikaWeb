<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Changer la colonne coordonnee en geography si elle existe déjà
        // DB::statement('ALTER TABLE point ALTER COLUMN coordonnee TYPE geography(POINT, 4326) USING coordonnee::geography');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionnel : repasser en geometry si besoin
        // DB::statement('ALTER TABLE point ALTER COLUMN coordonnee TYPE geometry(POINT, 4326) USING coordonnee::geometry');
    }
};
