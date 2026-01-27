<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TypeUtilisateurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('type_utilisateur')->insert([
            ['libelle' => 'Administrateur'],
            ['libelle' => 'Utilisateur'],
            ['libelle' => 'Modérateur'],
        ]);
    }
}
