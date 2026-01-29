<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EntrepriseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('entreprise')->insert([
            ['nom' => 'COLAS Madagascar'],
            ['nom' => 'SOGEA-SATOM'],
            ['nom' => 'ENTREPRISE JEAN LEFEBVRE'],
            ['nom' => 'RAZEL Madagascar'],
            ['nom' => 'SMATP'],
            ['nom' => 'EIFFAGE Madagascar'],
            ['nom' => 'SPAT BTP'],
        ]);
    }
}
