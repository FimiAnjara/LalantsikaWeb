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
            $table->unsignedBigInteger('id_statut');
            $table->unsignedBigInteger('id_point')->unique();
            $table->timestamps();
            
            $table->foreign('id_statut')
                ->references('id_statut')
                ->on('statut');
            
            $table->foreign('id_point')
                ->references('id_point')
                ->on('point');
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
