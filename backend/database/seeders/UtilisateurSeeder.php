<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UtilisateurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('utilisateur')->insert([
            [
                'identifiant' => 'user1',
                'mdp' => Hash::make('manager123'),
                'nom' => 'Randria',
                'prenom' => 'Paul',
                'dtn' => '1995-03-10',
                'email' => 'manager@example.com',
                'firebase_uid' => null,
                'id_sexe' => 1,
                'id_type_utilisateur' => 1,
                'synchronized' => true,
                'last_sync_at' => null,
            ],

        ]);
    }
}
