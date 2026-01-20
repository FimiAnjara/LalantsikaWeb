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
        Schema::create('point', function (Blueprint $table) {
            $table->id('id_point');
            $table->timestamps();
        });
        
        // Add geography column using raw SQL for PostGIS
        DB::statement('ALTER TABLE point ADD COLUMN coordonnee geography(POINT, 4326) NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('point');
    }
};
