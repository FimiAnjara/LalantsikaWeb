<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Tables de référence (sans dépendances)
        $this->call([
            SexeSeeder::class,
            TypeUtilisateurSeeder::class,
            StatutSeeder::class,
            EntrepriseSeeder::class,
            ParametreSeeder::class,
            TarifSeeder::class,
        ]);

        // Tables avec dépendances
        $this->call([
            UtilisateurSeeder::class,
            StatutUtilisateurSeeder::class,
            SignalementSeeder::class,
            HistoStatutSeeder::class,
            ImageSignalementSeeder::class,
        ]);

        // Données de test (optionnel - décommentez pour générer des données de test)
        // $this->call([
        //     TestDataSeeder::class,
        // ]);
    }
}
