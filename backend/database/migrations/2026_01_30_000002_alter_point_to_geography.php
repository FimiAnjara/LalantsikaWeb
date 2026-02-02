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
        // Migration non nécessaire - la colonne geography a été créée dans 2025_01_20_000006
        // Cette table n'existe pas
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
