<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SignalementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('signalement')->insert([
            [
                'daty' => '2025-01-15 08:30:00',
                'surface' => 50.00,
                'budget' => 500000.00,
                'description' => 'Nid de poule profond sur la route principale',
                'id_entreprise' => null,
                'id_utilisateur' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
                'point' => DB::raw("ST_GeogFromText('POINT(47.5256 -18.9101)')"),
            ],
            [
                'daty' => '2025-01-16 10:15:00',
                'surface' => 120.50,
                'budget' => 1500000.00,
                'description' => 'Route complètement dégradée avec plusieurs fissures',
                'id_entreprise' => 1,
                'id_utilisateur' => 3,
                'synchronized' => false,
                'last_sync_at' => null,
                'point' => DB::raw("ST_GeogFromText('POINT(47.5230 -18.9150)')"),
            ],
            [
                'daty' => '2025-01-17 14:00:00',
                'surface' => 30.00,
                'budget' => 250000.00,
                'description' => 'Affaissement de chaussée près du marché',
                'id_entreprise' => null,
                'id_utilisateur' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
                'point' => DB::raw("ST_GeogFromText('POINT(47.5250 -18.9147)')"),
            ],
            [
                'daty' => '2025-01-18 09:45:00',
                'surface' => 200.00,
                'budget' => 3000000.00,
                'description' => 'Inondation fréquente due à mauvais drainage',
                'id_entreprise' => 2,
                'id_utilisateur' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
                'point' => DB::raw("ST_GeogFromText('POINT(47.5375 -18.8890)')"),
            ],
            [
                'daty' => '2025-01-19 16:30:00',
                'surface' => 80.00,
                'budget' => 800000.00,
                'description' => 'Éclairage public défaillant sur 200m',
                'id_entreprise' => 1,
                'id_utilisateur' => 3,
                'synchronized' => false,
                'last_sync_at' => null,
                'point' => DB::raw("ST_GeogFromText('POINT(47.5268 -18.8995)')"),
            ],
            [
                'daty' => '2025-01-20 11:00:00',
                'surface' => 45.00,
                'budget' => 350000.00,
                'description' => 'Trottoir endommagé devant l\'école',
                'id_entreprise' => null,
                'id_utilisateur' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
                'point' => DB::raw("ST_GeogFromText('POINT(47.5237 -18.9032)')"),
            ],
        ]);
    }
}
