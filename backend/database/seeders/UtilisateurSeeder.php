<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UtilisateurSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('utilisateur')->insert([
            [
                'identifiant' => 'user1',
                'mdp' => Hash::make('lalantsika123'),
                'nom' => 'Lalantsika',
                'prenom' => 'Admin',
                'dtn' => '1995-03-10',
                'email' => 'lalantsikaproject@gmail.com',
                'photo_url' => '/storage/utilisateur/management.png',
                'firebase_uid' => null,
                'id_sexe' => 1,
                'id_type_utilisateur' => 1,
                'synchronized' => true,
                'last_sync_at' => null,
            ],
        ]);
    }
}
