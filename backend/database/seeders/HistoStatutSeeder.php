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
                'description' => 'Signalement créé',
                'id_statut' => 1, // Nouveau
                'id_signalement' => 1,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Historique pour signalement 2
            [
                'daty' => '2025-01-16 10:15:00',
                'description' => 'Signalement créé',
                'id_statut' => 1, // Nouveau
                'id_signalement' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'daty' => '2025-01-17 09:00:00',
                'description' => 'Prise en charge par entreprise',
                'id_statut' => 2, // En cours
                'id_signalement' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Historique pour signalement 3
            [
                'daty' => '2025-01-17 14:00:00',
                'description' => 'Signalement créé',
                'id_statut' => 1, // Nouveau
                'id_signalement' => 3,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Historique pour signalement 4
            [
                'daty' => '2025-01-18 09:45:00',
                'description' => 'Signalement créé',
                'id_statut' => 1, // Nouveau
                'id_signalement' => 4,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'daty' => '2025-01-19 10:00:00',
                'description' => 'En cours de traitement',
                'id_statut' => 2, // En cours
                'id_signalement' => 4,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'daty' => '2025-01-20 14:00:00',
                'description' => 'Travaux validés et terminés',
                'id_statut' => 3, // Terminé
                'id_signalement' => 4,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Historique pour signalement 5
            [
                'daty' => '2025-01-19 16:30:00',
                'description' => 'Signalement créé',
                'id_statut' => 1, // Nouveau
                'id_signalement' => 5,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'daty' => '2025-01-20 08:00:00',
                'description' => 'Prise en charge',
                'id_statut' => 2, // En cours
                'id_signalement' => 5,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'daty' => '2025-01-21 10:00:00',
                'description' => 'Travaux terminés',
                'id_statut' => 3, // Terminé
                'id_signalement' => 5,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Historique pour signalement 6
            [
                'daty' => '2025-01-20 11:00:00',
                'description' => 'Signalement créé',
                'id_statut' => 1, // Nouveau
                'id_signalement' => 6,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
        ]);
    }
}
