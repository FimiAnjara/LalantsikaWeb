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
                'mdp' => Hash::make('user123'),
                'nom' => 'Randria',
                'prenom' => 'Paul',
                'dtn' => '1995-03-10',
                'email' => 'paul.randria@gmail.com',
                'firebase_uid' => null,
                'id_sexe' => 1,
                'id_type_utilisateur' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'identifiant' => 'user2',
                'mdp' => Hash::make('user123'),
                'nom' => 'Rasoamanarivo',
                'prenom' => 'Hanta',
                'dtn' => '1988-12-01',
                'email' => 'hanta.rasoa@yahoo.fr',
                'firebase_uid' => null,
                'id_sexe' => 2,
                'id_type_utilisateur' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
        ]);
    }
}
