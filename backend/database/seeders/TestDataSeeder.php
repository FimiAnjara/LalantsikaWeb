<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Ce seeder crée des données de test pour les signalements avec leur historique de statuts
     * et différentes surfaces pour tester le calcul des délais de traitement.
     */
    public function run(): void
    {
        // Vider les tables de test (compatible PostgreSQL)
        DB::table('histo_statut')->delete();
        DB::table('signalement')->delete();
        
        // Reset les sequences PostgreSQL de façon sécurisée
        try {
            DB::statement('SELECT setval(\'histo_statut_id_histo_statut_seq\', 1, false)');
            DB::statement('SELECT setval(\'signalement_id_signalement_seq\', 1, false)');
        } catch (\Exception $e) {
            // Ignorer si les séquences n'existent pas encore
            $this->command->warn('Note: Les séquences PostgreSQL seront créées automatiquement');
        }

        // S'assurer que les statuts existent
        $this->createStatuts();
        
        // Créer des utilisateurs de test
        $this->createTestUsers();
        
        // Créer des entreprises de test
        $this->createTestEntreprises();
        
        // Créer des signalements avec historique
        $this->createSignalementsAvecHistorique();
        
        $this->command->info('✅ Données de test créées avec succès !');
        $this->command->info('📊 Signalements créés avec différentes surfaces et historiques de statuts');
    }

    private function createStatuts(): void
    {
        $statuts = [
            ['id_statut' => 1, 'libelle' => 'Nouveau'],
            ['id_statut' => 2, 'libelle' => 'En cours'],
            ['id_statut' => 3, 'libelle' => 'Terminé'],
        ];

        foreach ($statuts as $statut) {
            $exists = DB::table('statut')->where('id_statut', $statut['id_statut'])->exists();
            if (!$exists) {
                DB::table('statut')->insert($statut);
            }
        }
    }

    private function createTestUsers(): void
    {
        // S'assurer que les tables de référence existent
        $this->createSexes();
        $this->createTypeUtilisateurs();
        
        $users = [
            [
                'id_utilisateur' => 100,
                'identifiant' => 'jean.rakoto',
                'nom' => 'Rakoto',
                'prenom' => 'Jean',
                'dtn' => '1990-05-15',
                'email' => 'jean.rakoto@test.com',
                'mdp' => Hash::make('password123'),
                'id_sexe' => 1,
                'id_type_utilisateur' => 1
            ],
            [
                'id_utilisateur' => 101,
                'identifiant' => 'marie.rabe',
                'nom' => 'Rabe',
                'prenom' => 'Marie',
                'dtn' => '1988-08-22',
                'email' => 'marie.rabe@test.com',
                'mdp' => Hash::make('password123'),
                'id_sexe' => 2,
                'id_type_utilisateur' => 1
            ],
            [
                'id_utilisateur' => 102,
                'identifiant' => 'paul.andry',
                'nom' => 'Andry',
                'prenom' => 'Paul',
                'dtn' => '1985-12-10',
                'email' => 'paul.andry@test.com',
                'mdp' => Hash::make('password123'),
                'id_sexe' => 1,
                'id_type_utilisateur' => 1
            ]
        ];

        foreach ($users as $user) {
            $exists = DB::table('utilisateur')->where('id_utilisateur', $user['id_utilisateur'])->exists();
            if (!$exists) {
                // Vérifier aussi si l'identifiant existe déjà
                $identExists = DB::table('utilisateur')->where('identifiant', $user['identifiant'])->exists();
                if (!$identExists) {
                    DB::table('utilisateur')->insert($user);
                }
            }
        }
    }
    
    private function createSexes(): void
    {
        $sexes = [
            ['id_sexe' => 1, 'libelle' => 'Masculin'],
            ['id_sexe' => 2, 'libelle' => 'Féminin'],
        ];

        foreach ($sexes as $sexe) {
            $exists = DB::table('sexe')->where('id_sexe', $sexe['id_sexe'])->exists();
            if (!$exists) {
                DB::table('sexe')->insert($sexe);
            }
        }
    }
    
    private function createTypeUtilisateurs(): void
    {
        $types = [
            ['id_type_utilisateur' => 1, 'libelle' => 'Utilisateur'],
            ['id_type_utilisateur' => 2, 'libelle' => 'Manager'],
        ];

        foreach ($types as $type) {
            $exists = DB::table('type_utilisateur')->where('id_type_utilisateur', $type['id_type_utilisateur'])->exists();
            if (!$exists) {
                DB::table('type_utilisateur')->insert($type);
            }
        }
    }

    private function createTestEntreprises(): void
    {
        // Utilise les entreprises existantes du EntrepriseSeeder
        $entreprises = [
            ['id_entreprise' => 1, 'nom' => 'COLAS Madagascar'],
            ['id_entreprise' => 2, 'nom' => 'SOGEA-SATOM'],
            ['id_entreprise' => 3, 'nom' => 'ENTREPRISE JEAN LEFEBVRE'],
            ['id_entreprise' => 4, 'nom' => 'RAZEL Madagascar'],
            ['id_entreprise' => 5, 'nom' => 'SMATP'],
            ['id_entreprise' => 6, 'nom' => 'EIFFAGE Madagascar'],
            ['id_entreprise' => 7, 'nom' => 'SPAT BTP'],
        ];

        foreach ($entreprises as $entreprise) {
            $exists = DB::table('entreprise')->where('id_entreprise', $entreprise['id_entreprise'])->exists();
            if (!$exists) {
                DB::table('entreprise')->insert($entreprise);
            }
        }
    }

    private function createSignalementsAvecHistorique(): void
    {
        // Coordonnées de différentes villes de Madagascar
        $locations = [
            ['lat' => -18.8792, 'lng' => 47.5079, 'city' => 'Antananarivo'],
            ['lat' => -18.1443, 'lng' => 49.3958, 'city' => 'Toamasina'],
            ['lat' => -21.4545, 'lng' => 47.0862, 'city' => 'Fianarantsoa'],
            ['lat' => -23.3516, 'lng' => 43.6854, 'city' => 'Toliara'],
            ['lat' => -12.2787, 'lng' => 49.2913, 'city' => 'Antsiranana'],
            ['lat' => -15.7167, 'lng' => 46.3167, 'city' => 'Mahajanga'],
            ['lat' => -19.8659, 'lng' => 47.0333, 'city' => 'Antsirabe'],
            ['lat' => -20.2833, 'lng' => 44.2833, 'city' => 'Morondava'],
        ];
        
        $signalements = [
            // Cas 1: Petit projet terminé rapidement (surface < 100m²) - COLAS Madagascar
            [
                'id_signalement' => 1,
                'surface' => 45.5,
                'description' => 'Réparation trottoir devant école primaire - Surface : 45.5m²',
                'budget' => 150000,
                'id_utilisateur' => 100,
                'id_entreprise' => 1, // COLAS Madagascar
                'location' => $locations[0], // Antananarivo
                'daty' => Carbon::now()->subDays(8)->format('Y-m-d H:i:s'),
                'statut_actuel' => 3, // Terminé
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(8), 'description' => 'Signalement créé'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(6), 'description' => 'Travaux commencés'],
                    ['statut' => 3, 'date' => Carbon::now()->subDays(3), 'description' => 'Travaux terminés']
                ]
            ],
            
            // Cas 2: Projet moyen en cours (100-500m²) - SOGEA-SATOM
            [
                'id_signalement' => 2,
                'surface' => 250.0,
                'description' => 'Réfection route principale - Surface : 250m²',
                'budget' => 800000,
                'id_utilisateur' => 101,
                'id_entreprise' => 2, // SOGEA-SATOM
                'location' => $locations[1], // Toamasina
                'daty' => Carbon::now()->subDays(15)->format('Y-m-d H:i:s'),
                'statut_actuel' => 2, // En cours
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(15), 'description' => 'Signalement reçu'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(10), 'description' => 'Équipe déployée sur site']
                ]
            ],
            
            // Cas 3: Grand projet terminé (surface > 500m²) - ENTREPRISE JEAN LEFEBVRE
            [
                'id_signalement' => 3,
                'surface' => 1200.0,
                'description' => 'Construction nouveau pont - Surface : 1200m²',
                'budget' => 2500000,
                'id_utilisateur' => 102,
                'id_entreprise' => 3, // ENTREPRISE JEAN LEFEBVRE
                'location' => $locations[2], // Fianarantsoa
                'daty' => Carbon::now()->subDays(45)->format('Y-m-d H:i:s'),
                'statut_actuel' => 3, // Terminé
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(45), 'description' => 'Projet approuvé'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(38), 'description' => 'Début des travaux de fondation'],
                    ['statut' => 3, 'date' => Carbon::now()->subDays(5), 'description' => 'Pont achevé et inauguré']
                ]
            ],
            
            // Cas 4: Petite surface mais délai long (problème) - RAZEL Madagascar
            [
                'id_signalement' => 4,
                'surface' => 80.0,
                'description' => 'Réparation caniveau bouché - Surface : 80m²',
                'budget' => 120000,
                'id_utilisateur' => 100,
                'id_entreprise' => 4, // RAZEL Madagascar
                'location' => $locations[3], // Toliara
                'daty' => Carbon::now()->subDays(25)->format('Y-m-d H:i:s'),
                'statut_actuel' => 2, // En cours (trop long!)
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(25), 'description' => 'Signalement urgent'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(18), 'description' => 'Intervention programmée']
                ]
            ],
            
            // Cas 5: Surface moyenne, nouveau (vient d'arriver) - SMATP
            [
                'id_signalement' => 5,
                'surface' => 300.0,
                'description' => 'Aménagement parking municipal - Surface : 300m²',
                'budget' => 950000,
                'id_utilisateur' => 101,
                'id_entreprise' => 5, // SMATP
                'location' => $locations[4], // Antsiranana
                'daty' => Carbon::now()->subDays(2)->format('Y-m-d H:i:s'),
                'statut_actuel' => 1, // Nouveau
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(2), 'description' => 'Demande reçue']
                ]
            ],
            
            // Cas 6: Très grande surface, terminé dans les temps - EIFFAGE Madagascar
            [
                'id_signalement' => 6,
                'surface' => 2500.0,
                'description' => 'Rénovation place centrale - Surface : 2500m²',
                'budget' => 5000000,
                'id_utilisateur' => 102,
                'id_entreprise' => 6, // EIFFAGE Madagascar
                'location' => $locations[5], // Mahajanga
                'daty' => Carbon::now()->subDays(60)->format('Y-m-d H:i:s'),
                'statut_actuel' => 3, // Terminé
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(60), 'description' => 'Projet communal approuvé'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(50), 'description' => 'Début des travaux de terrassement'],
                    ['statut' => 3, 'date' => Carbon::now()->subDays(8), 'description' => 'Inauguration de la nouvelle place']
                ]
            ],
            
            // Cas 7: Surface moyenne, en cours depuis longtemps - SPAT BTP
            [
                'id_signalement' => 7,
                'surface' => 400.0,
                'description' => 'Réfection système drainage - Surface : 400m²',
                'budget' => 1200000,
                'id_utilisateur' => 100,
                'id_entreprise' => 7, // SPAT BTP
                'location' => $locations[6], // Antsirabe
                'daty' => Carbon::now()->subDays(35)->format('Y-m-d H:i:s'),
                'statut_actuel' => 2, // En cours
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(35), 'description' => 'Problème signalé par habitants'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(28), 'description' => 'Études techniques terminées']
                ]
            ],
            
            // Cas 8: Petite surface terminée très rapidement - COLAS Madagascar
            [
                'id_signalement' => 8,
                'surface' => 25.0,
                'description' => 'Réparation nid-de-poule - Surface : 25m²',
                'budget' => 75000,
                'id_utilisateur' => 101,
                'id_entreprise' => 1, // COLAS Madagascar
                'location' => $locations[7], // Morondava
                'daty' => Carbon::now()->subDays(4)->format('Y-m-d H:i:s'),
                'statut_actuel' => 3, // Terminé
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(4), 'description' => 'Signalement urgent'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(3), 'description' => 'Intervention immédiate'],
                    ['statut' => 3, 'date' => Carbon::now()->subDays(2), 'description' => 'Réparation terminée']
                ]
            ],
            
            // Cas 9: Projet moyen terminé - SOGEA-SATOM (bon délai)
            [
                'id_signalement' => 9,
                'surface' => 180.0,
                'description' => 'Réhabilitation marché local - Surface : 180m²',
                'budget' => 650000,
                'id_utilisateur' => 102,
                'id_entreprise' => 2, // SOGEA-SATOM
                'location' => $locations[0], // Antananarivo
                'daty' => Carbon::now()->subDays(12)->format('Y-m-d H:i:s'),
                'statut_actuel' => 3, // Terminé
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(12), 'description' => 'Demande validée'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(9), 'description' => 'Travaux démarrés'],
                    ['statut' => 3, 'date' => Carbon::now()->subDays(3), 'description' => 'Marché rénové']
                ]
            ],
            
            // Cas 10: Grande surface en cours - ENTREPRISE JEAN LEFEBVRE
            [
                'id_signalement' => 10,
                'surface' => 850.0,
                'description' => 'Construction centre sportif - Surface : 850m²',
                'budget' => 3200000,
                'id_utilisateur' => 100,
                'id_entreprise' => 3, // ENTREPRISE JEAN LEFEBVRE
                'location' => $locations[1], // Toamasina
                'daty' => Carbon::now()->subDays(20)->format('Y-m-d H:i:s'),
                'statut_actuel' => 2, // En cours
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(20), 'description' => 'Projet lancé'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(15), 'description' => 'Fondations en cours']
                ]
            ],
            
            // Cas 11: Petite surface nouveau - RAZEL Madagascar
            [
                'id_signalement' => 11,
                'surface' => 55.0,
                'description' => 'Installation éclairage public - Surface : 55m²',
                'budget' => 95000,
                'id_utilisateur' => 101,
                'id_entreprise' => 4, // RAZEL Madagascar
                'location' => $locations[2], // Fianarantsoa
                'daty' => Carbon::now()->subDays(1)->format('Y-m-d H:i:s'),
                'statut_actuel' => 1, // Nouveau
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(1), 'description' => 'Signalement reçu']
                ]
            ],
            
            // Cas 12: Moyenne surface terminée rapidement - EIFFAGE Madagascar
            [
                'id_signalement' => 12,
                'surface' => 320.0,
                'description' => 'Pavé rue commerçante - Surface : 320m²',
                'budget' => 780000,
                'id_utilisateur' => 102,
                'id_entreprise' => 6, // EIFFAGE Madagascar
                'location' => $locations[3], // Toliara
                'daty' => Carbon::now()->subDays(18)->format('Y-m-d H:i:s'),
                'statut_actuel' => 3, // Terminé
                'historique' => [
                    ['statut' => 1, 'date' => Carbon::now()->subDays(18), 'description' => 'Demande urgente'],
                    ['statut' => 2, 'date' => Carbon::now()->subDays(14), 'description' => 'Travaux démarrés'],
                    ['statut' => 3, 'date' => Carbon::now()->subDays(4), 'description' => 'Travaux terminés']
                ]
            ]
        ];

        foreach ($signalements as $sig) {
            // Créer le signalement avec point géographique
            $location = $sig['location'];
            $pointWkt = "POINT({$location['lng']} {$location['lat']})";
            
            // Insertion avec géométrie PostGIS
            DB::statement("
                INSERT INTO signalement (id_signalement, daty, surface, budget, description, id_utilisateur, id_entreprise, city, point)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ST_GeogFromText(?))
            ", [
                $sig['id_signalement'],
                $sig['daty'],
                $sig['surface'],
                $sig['budget'],
                $sig['description'],
                $sig['id_utilisateur'],
                $sig['id_entreprise'],
                $location['city'],
                $pointWkt
            ]);

            // Créer l'historique des statuts
            foreach ($sig['historique'] as $histo) {
                DB::table('histo_statut')->insert([
                    'id_signalement' => $sig['id_signalement'],
                    'id_statut' => $histo['statut'],
                    'daty' => $histo['date']->format('Y-m-d H:i:s'),
                    'description' => $histo['description'],
                    'synchronized' => false
                ]);
            }
        }

        $this->command->info('📋 Créé ' . count($signalements) . ' signalements avec historique et géométries');
        $this->command->warn('🔍 Surfaces testées : 25m² à 2500m² (petite/moyenne/grande)');
        $this->command->warn('🏢 Entreprises : 4 entreprises avec projets variés');
        $this->command->warn('📍 Villes : 8 localisations à Madagascar');
        $this->command->info('🚀 Testez maintenant le tableau de bord manager !');
    }
}