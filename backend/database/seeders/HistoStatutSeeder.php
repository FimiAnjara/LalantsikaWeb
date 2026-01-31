<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HistoStatutSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('histo_statut')->insert([
            // Historique pour signalement 1
            [
                'daty' => '2025-01-15 08:30:00',
                'image' => 'histo_1_1.jpg',
                'description' => 'Signalement créé',
                'id_statut' => 1,
                'id_signalement' => 1,
            ],
            // Historique pour signalement 2
            [
                'daty' => '2025-01-16 10:15:00',
                'image' => 'histo_2_1.jpg',
                'description' => 'Signalement créé',
                'id_statut' => 1,
                'id_signalement' => 2,
            ],
            [
                'daty' => '2025-01-17 09:00:00',
                'image' => 'histo_2_2.jpg',
                'description' => 'Prise en charge par JIRAMA',
                'id_statut' => 1,
                'id_signalement' => 3,
            ],
            // Historique pour signalement 4
            [
                'daty' => '2025-01-18 09:45:00',
                'image' => 'histo_4_1.jpg',
                'description' => 'Signalement créé',
                'id_statut' => 1,
                'id_signalement' => 4,
            ],
            [
                'daty' => '2025-01-19 10:00:00',
                'image' => 'histo_4_2.jpg',
                'description' => 'En cours de traitement',
                'id_statut' => 2,
                'id_signalement' => 4,
            ],
            [
                'daty' => '2025-01-20 14:00:00',
                'image' => 'histo_4_3.jpg',
                'description' => 'Travaux validés et terminés',
                'id_statut' => 3,
                'id_signalement' => 4,
            ],
            // Historique pour signalement 5
            [
                'daty' => '2025-01-19 16:30:00',
                'image' => 'histo_5_1.jpg',
                'description' => 'Signalement créé',
                'id_statut' => 1,
                'id_signalement' => 5,
            ],
            [
                'daty' => '2025-01-20 08:00:00',
                'image' => 'histo_5_2.jpg',
                'description' => 'Prise en charge',
                'id_statut' => 2,
                'id_signalement' => 5,
            ],
            [
                'daty' => '2025-01-21 10:00:00',
                'image' => 'histo_5_3.jpg',
                'description' => 'Travaux terminés',
                'id_statut' => 5,
                'id_signalement' => 5,
            ],
        ]);
    }
}
