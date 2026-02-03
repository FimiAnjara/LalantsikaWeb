<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ImageSignalementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('image_signalement')->insert([
            // Images pour histo_statut 1 (signalement 1)
            [
                'image' => 'histo_1_1_img1.jpg',
                'id_histo_statut' => 1,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'image' => 'histo_1_1_img2.jpg',
                'id_histo_statut' => 1,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Images pour histo_statut 2 (signalement 2)
            [
                'image' => 'histo_2_1_img1.jpg',
                'id_histo_statut' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Images pour histo_statut 3 (signalement 2 - en cours)
            [
                'image' => 'histo_2_2_img1.jpg',
                'id_histo_statut' => 3,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'image' => 'histo_2_2_img2.jpg',
                'id_histo_statut' => 3,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Images pour histo_statut 4 (signalement 3)
            [
                'image' => 'histo_3_1_img1.jpg',
                'id_histo_statut' => 4,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Images pour histo_statut 5 (signalement 4)
            [
                'image' => 'histo_4_1_img1.jpg',
                'id_histo_statut' => 5,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Images pour histo_statut 6 (signalement 4 - en cours)
            [
                'image' => 'histo_4_2_img1.jpg',
                'id_histo_statut' => 6,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'image' => 'histo_4_2_img2.jpg',
                'id_histo_statut' => 6,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'image' => 'histo_4_2_img3.jpg',
                'id_histo_statut' => 6,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            // Images pour histo_statut 7 (signalement 4 - terminé)
            [
                'image' => 'histo_4_3_after1.jpg',
                'id_histo_statut' => 7,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'image' => 'histo_4_3_after2.jpg',
                'id_histo_statut' => 7,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
        ]);
    }
}