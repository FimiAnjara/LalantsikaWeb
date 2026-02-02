<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StatutSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('statut')->insert([
            ['libelle' => 'En attente'],
            ['libelle' => 'En cours'],
            ['libelle' => 'Terminé'],
        ]);
    }
}
