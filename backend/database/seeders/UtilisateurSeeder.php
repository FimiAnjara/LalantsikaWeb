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
                'identifiant' => 'admin',
                'mdp' => Hash::make('lalantsika123'),
                'nom' => 'Lalantsika',
                'prenom' => 'Admin',
                'dtn' => '1995-03-10',
                'email' => 'lalantsikaproject@gmail.com',
                'photo_url' => '/storage/utilisateur/management.png',
                'firebase_uid' => null,
                'id_sexe' => 1,
                'id_type_utilisateur' => 1,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
            [
                'identifiant' => 'user1',
                'mdp' => 'user123',
                'nom' => 'Teste',
                'prenom' => 'User',
                'dtn' => '1995-03-10',
                'email' => 'userteste@gmail.com',
                'photo_url' => null,
                'firebase_uid' => null,
                'id_sexe' => 1,
                'id_type_utilisateur' => 2,
                'synchronized' => false,
                'last_sync_at' => null,
            ],
        ]);
    }
}
