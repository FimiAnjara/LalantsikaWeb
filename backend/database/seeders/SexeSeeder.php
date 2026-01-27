<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SexeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('sexe')->insert([
            ['libelle' => 'Masculin'],
            ['libelle' => 'Féminin'],
        ]);
    }
}
