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
                'identifiant' => 'admin',
                'mdp' => Hash::make('admin123'),
                'nom' => 'Rakoto',
                'prenom' => 'Jean',
                'dtn' => '1990-05-15',
                'email' => 'admin@lalantsika.mg',
                'id_sexe' => 1,
                'id_type_utilisateur' => 1,
            ],
            [
                'identifiant' => 'moderateur1',
                'mdp' => Hash::make('mod123'),
                'nom' => 'Razafy',
                'prenom' => 'Marie',
                'dtn' => '1992-08-20',
                'email' => 'moderateur@lalantsika.mg',
                'id_sexe' => 2,
                'id_type_utilisateur' => 3,
            ],
            [
                'identifiant' => 'user1',
                'mdp' => Hash::make('user123'),
                'nom' => 'Randria',
                'prenom' => 'Paul',
                'dtn' => '1995-03-10',
                'email' => 'paul.randria@gmail.com',
                'id_sexe' => 1,
                'id_type_utilisateur' => 2,
            ],
            [
                'identifiant' => 'user2',
                'mdp' => Hash::make('user123'),
                'nom' => 'Rasoamanarivo',
                'prenom' => 'Hanta',
                'dtn' => '1988-12-01',
                'email' => 'hanta.rasoa@yahoo.fr',
                'id_sexe' => 2,
                'id_type_utilisateur' => 2,
            ],
            [
                'identifiant' => 'user3',
                'mdp' => Hash::make('user123'),
                'nom' => 'Rabemananjara',
                'prenom' => 'Luc',
                'dtn' => '2000-07-25',
                'email' => 'luc.rabe@gmail.com',
                'id_sexe' => 1,
                'id_type_utilisateur' => 2,
            ],
        ]);
    }
}
