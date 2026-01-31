<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FixSignalementPointsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Coordonnées de routes principales d'Antananarivo (exemples)
        $routes = [
            // Avenue de l'Indépendance
            ['lat' => -18.9101, 'lng' => 47.5256],
            // Route d'Ambohijatovo
            ['lat' => -18.9150, 'lng' => 47.5230],
            // Route d'Ankorondrano
            ['lat' => -18.8705, 'lng' => 47.5372],
            // Route d'Anosy
            ['lat' => -18.9147, 'lng' => 47.5250],
            // Route d'Ampasapito
            ['lat' => -18.8890, 'lng' => 47.5375],
            // Route d'Andravoahangy
            ['lat' => -18.8995, 'lng' => 47.5268],
            // Route d'Ampefiloha
            ['lat' => -18.9032, 'lng' => 47.5237],
            // Route d'Analakely
            ['lat' => -18.9107, 'lng' => 47.5259],
            // Route d'Ankadifotsy
            ['lat' => -18.8990, 'lng' => 47.5290],
            // Route d'Anosibe
            ['lat' => -18.9130, 'lng' => 47.5090],
        ];

        $signalements = DB::table('signalement')->get();
        $countRoutes = count($routes);
        $i = 0;
        foreach ($signalements as $signalement) {
            $route = $routes[$i % $countRoutes];
            $latitude = $route['lat'];
            $longitude = $route['lng'];
            DB::table('signalement')->where('id_signalement', $signalement->id_signalement)
                ->update([
                    'point' => DB::raw("ST_SetSRID(ST_MakePoint($longitude, $latitude), 4326)")
                ]);
            $i++;
        }
    }
}
