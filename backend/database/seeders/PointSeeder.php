<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PointSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Coordonnées de quelques points à Madagascar (Antananarivo et environs)
        $points = [
            ['longitude' => 47.5079, 'latitude' => -18.8792], // Antananarivo centre
            ['longitude' => 47.5162, 'latitude' => -18.9137], // Analakely
            ['longitude' => 47.5334, 'latitude' => -18.8701], // Andraharo
            ['longitude' => 47.4879, 'latitude' => -18.9053], // Ambohijatovo
            ['longitude' => 47.5231, 'latitude' => -18.9285], // Ankorondrano
            ['longitude' => 47.4756, 'latitude' => -18.8945], // Isoraka
            ['longitude' => 47.5412, 'latitude' => -18.8823], // Ivandry
            ['longitude' => 47.5567, 'latitude' => -18.8956], // Ambatobe
            ['longitude' => 47.4923, 'latitude' => -18.9201], // Mahamasina
            ['longitude' => 47.5089, 'latitude' => -18.8634], // Ambohidahy
        ];

        foreach ($points as $point) {
            DB::statement("INSERT INTO point (coordonnee) VALUES (ST_SetSRID(ST_MakePoint({$point['longitude']}, {$point['latitude']}), 4326)::geography)");
        }
    }
}
