<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('utilisateur', function (Blueprint $table) {
            $table->boolean('synchronized')->default(false)->after('id_type_utilisateur');
            $table->timestamp('last_sync_at')->nullable()->after('synchronized');
        });
    }

    public function down(): void
    {
        Schema::table('utilisateur', function (Blueprint $table) {
            $table->dropColumn(['synchronized', 'last_sync_at']);
        });
    }
};
