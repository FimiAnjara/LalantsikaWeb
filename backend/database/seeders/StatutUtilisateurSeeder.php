<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StatutUtilisateurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('statut_utilisateur')->insert([
            [
                'date_' => '2025-01-01 00:00:00',
                'etat' => 1, // Actif
                'id_utilisateur' => 1,
            ],
            [
                'date_' => '2025-01-01 00:00:00',
                'etat' => 1, // Actif
                'id_utilisateur' => 2,
            ],
            [
                'date_' => '2025-01-05 00:00:00',
                'etat' => 1, // Actif
                'id_utilisateur' => 3,
            ],
        ]);
    }
}
