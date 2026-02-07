<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Sexe;
use App\Models\TypeUtilisateur;
use App\Models\Signalement;
use App\Models\HistoStatut;
use App\Models\Statut;
use App\Models\Entreprise;
use App\Models\Parametre;
use App\Services\Firebase\FirebaseRestService;
use App\Services\Notification\FcmService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SyncController extends Controller
{
    protected $firebaseRestService;
    protected $fcmService;

    public function __construct(FirebaseRestService $firebaseRestService, FcmService $fcmService)
    {
        $this->firebaseRestService = $firebaseRestService;
        $this->fcmService = $fcmService;
    }

    /**
     * Synchroniser tous les utilisateurs non synchronisés vers Firebase
     * 
     * @OA\Post(
     *     path="/api/sync/utilisateurs",
     *     summary="Synchroniser les utilisateurs vers Firebase",
     *     tags={"Synchronisation"},
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="default_password", type="string", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Synchronisation réussie"
     *     )
     * )
     */
    public function synchroniserUtilisateurs(Request $request)
    {
        try {
            // Mot de passe par défaut pour créer les utilisateurs dans Firebase Auth
            $defaultPassword = $request->input('default_password', 'mdp123');

            // Récupérer les utilisateurs non synchronisés
            $utilisateurs = User::where('synchronized', false)
                ->orWhereNull('synchronized')
                ->orWhereNull('firebase_uid')
                ->orWhere('firebase_uid', 'like', 'user_%') // Les anciens UIDs générés localement
                ->with(['sexe', 'typeUtilisateur'])
                ->get();

            if ($utilisateurs->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Aucun utilisateur à synchroniser',
                    'data' => [
                        'total' => 0,
                        'synced' => 0,
                        'failed' => 0
                    ]
                ]);
            }

            $synced = 0;
            $failed = 0;
            $errors = [];

            foreach ($utilisateurs as $utilisateur) {
                try {
                    $this->syncSingleUser($utilisateur, $defaultPassword);
                    $synced++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = [
                        'id_utilisateur' => $utilisateur->id_utilisateur,
                        'email' => $utilisateur->email,
                        'error' => $e->getMessage()
                    ];
                    Log::error("Erreur sync utilisateur {$utilisateur->id_utilisateur}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Synchronisation terminée",
                'data' => [
                    'total' => $utilisateurs->count(),
                    'synced' => $synced,
                    'failed' => $failed,
                    'default_password_used' => $defaultPassword,
                    'errors' => $errors
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur synchronisation globale: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser un utilisateur spécifique par ID
     * 
     * @OA\Post(
     *     path="/api/sync/utilisateurs/{id}",
     *     summary="Synchroniser un utilisateur spécifique",
     *     tags={"Synchronisation"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\RequestBody(
     *         @OA\JsonContent(
     *             @OA\Property(property="password", type="string", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Utilisateur synchronisé"
     *     )
     * )
     */
    public function synchroniserUtilisateur(Request $request, $id)
    {
        try {
            $utilisateur = User::with(['sexe', 'typeUtilisateur'])->find($id);

            if (!$utilisateur) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }

            // Mot de passe spécifique ou par défaut
            $password = $request->input('password', 'mdp123');

            $this->syncSingleUser($utilisateur, $password);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur synchronisé avec succès',
                'data' => [
                    'id_utilisateur' => $utilisateur->id_utilisateur,
                    'email' => $utilisateur->email,
                    'firebase_uid' => $utilisateur->firebase_uid,
                    'last_sync_at' => $utilisateur->last_sync_at,
                    'password_used' => $password
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur sync utilisateur {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir le statut de synchronisation
     * 
     * @OA\Get(
     *     path="/api/sync/status",
     *     summary="Obtenir le statut de synchronisation",
     *     tags={"Synchronisation"},
     *     @OA\Response(
     *         response=200,
     *         description="Statut de synchronisation"
     *     )
     * )
     */
    public function status()
    {
        try {
            $total = User::count();
            $synced = User::where('synchronized', true)->count();
            $notSynced = User::where('synchronized', false)->orWhereNull('synchronized')->count();
            $withFirebaseUid = User::whereNotNull('firebase_uid')->count();
            $withoutFirebaseUid = User::whereNull('firebase_uid')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_utilisateurs' => $total,
                    'synchronises' => $synced,
                    'non_synchronises' => $notSynced,
                    'avec_firebase_uid' => $withFirebaseUid,
                    'sans_firebase_uid' => $withoutFirebaseUid,
                    'pourcentage_sync' => $total > 0 ? round(($synced / $total) * 100, 2) : 0
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du statut',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir le statut de synchronisation des paramètres
     * 
     * @OA\Get(
     *     path="/api/sync/parametres/status",
     *     summary="Obtenir le statut de synchronisation des paramètres",
     *     tags={"Synchronisation"},
     *     @OA\Response(
     *         response=200,
     *         description="Statut de synchronisation des paramètres"
     *     )
     * )
     */
    public function parametreStatus()
    {
        try {
            $total = Parametre::count();
            $synced = Parametre::where('synchronized', true)->count();
            $notSynced = Parametre::whereRaw('synchronized = false OR synchronized IS NULL')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'synchronises' => $synced,
                    'non_synchronises' => $notSynced,
                    'pourcentage_sync' => $total > 0 ? round(($synced / $total) * 100, 2) : 0
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération statut paramètres: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du statut des paramètres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Forcer la re-synchronisation de tous les utilisateurs
     * 
     * @OA\Post(
     *     path="/api/sync/force",
     *     summary="Forcer la re-synchronisation de tous les utilisateurs",
     *     tags={"Synchronisation"},
     *     @OA\Response(
     *         response=200,
     *         description="Re-synchronisation forcée"
     *     )
     * )
     */
    public function forceSync(Request $request)
    {
        try {
            $resetFirebaseUid = $request->input('reset_firebase_uid', false);
            $defaultPassword = $request->input('default_password', 'mdp123');
            
            if ($resetFirebaseUid) {
                // Réinitialiser les firebase_uid pour forcer une nouvelle création dans Firebase Auth
                // ATTENTION: Ceci ne fonctionnera que si les utilisateurs ont été supprimés dans Firebase Console
                User::query()->update([
                    'synchronized' => false,
                    'firebase_uid' => null
                ]);
                Log::info("🔄 Firebase UIDs réinitialisés - nouvelle création nécessaire");
            } else {
                // Réinitialiser seulement le statut de synchronisation
                User::query()->update(['synchronized' => false]);
            }

            // Créer une nouvelle requête avec le password
            $syncRequest = new Request(['default_password' => $defaultPassword]);
            
            // Lancer la synchronisation
            return $this->synchroniserUtilisateurs($syncRequest);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la re-synchronisation forcée',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier l'état des utilisateurs Firebase
     */
    public function checkFirebaseUsers()
    {
        try {
            $users = User::select('id_utilisateur', 'email', 'firebase_uid', 'synchronized', 'last_sync_at')
                ->orderBy('id_utilisateur')
                ->get();
            
            $stats = [
                'total' => $users->count(),
                'with_real_uid' => $users->filter(fn($u) => $u->firebase_uid && !str_starts_with($u->firebase_uid, 'user_') && !str_starts_with($u->firebase_uid, 'local_') && !str_starts_with($u->firebase_uid, 'pending_'))->count(),
                'with_local_uid' => $users->filter(fn($u) => $u->firebase_uid && (str_starts_with($u->firebase_uid, 'local_') || str_starts_with($u->firebase_uid, 'user_')))->count(),
                'with_pending_uid' => $users->filter(fn($u) => $u->firebase_uid && str_starts_with($u->firebase_uid, 'pending_'))->count(),
                'without_uid' => $users->filter(fn($u) => empty($u->firebase_uid))->count(),
                'synchronized' => $users->filter(fn($u) => $u->synchronized)->count(),
            ];
            
            return response()->json([
                'success' => true,
                'stats' => $stats,
                'users' => $users,
                'instructions' => [
                    'pending_uid' => 'Ces utilisateurs existent dans Firebase Auth avec un mot de passe différent. Supprimez-les dans Firebase Console, puis relancez la sync.',
                    'local_uid' => 'Ces utilisateurs n\'ont pas pu être créés dans Firebase Auth. Vérifiez les logs.',
                    'fix_command' => 'POST /api/sync/force avec {"reset_firebase_uid": true} après avoir supprimé les utilisateurs dans Firebase Console'
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser un utilisateur unique vers Firebase
     * Crée l'utilisateur dans Firebase Auth ET Firestore
     * 
     * @param User $utilisateur L'utilisateur à synchroniser
     * @param string $password Le mot de passe pour Firebase Auth
     */
    private function syncSingleUser(User $utilisateur, string $password)
    {
        DB::beginTransaction();

        try {
            $firebaseUid = $utilisateur->firebase_uid;

            // Si pas de vrai firebase_uid (ou uid local généré), créer dans Firebase Auth
            if (empty($firebaseUid) || str_starts_with($firebaseUid, 'user_') || str_starts_with($firebaseUid, 'local_')) {
                Log::info("Création Firebase Auth pour: {$utilisateur->email}");
                
                // Créer l'utilisateur dans Firebase Auth
                $authResult = $this->firebaseRestService->createAuthUser(
                    $utilisateur->email,
                    $password
                );

                if ($authResult && isset($authResult['uid'])) {
                    $firebaseUid = $authResult['uid'];
                    Log::info("✅ Firebase Auth créé: {$utilisateur->email} -> UID: {$firebaseUid}");
                } elseif ($authResult && isset($authResult['exists']) && $authResult['exists']) {
                    // L'utilisateur existe déjà - essayer de se connecter avec le mot de passe
                    Log::warning("⚠️ Utilisateur existe déjà dans Firebase Auth: {$utilisateur->email}");
                    
                    $signInResult = $this->firebaseRestService->signInAuthUser(
                        $utilisateur->email,
                        $password
                    );
                    
                    if ($signInResult && isset($signInResult['uid'])) {
                        $firebaseUid = $signInResult['uid'];
                        Log::info("✅ Firebase Auth existant récupéré: {$utilisateur->email} -> UID: {$firebaseUid}");
                    } else {
                        // Le mot de passe ne correspond pas - envoyer email de reset
                        Log::error("❌ Mot de passe Firebase Auth différent pour: {$utilisateur->email}");
                        Log::error("   L'utilisateur doit réinitialiser son mot de passe ou supprimer manuellement dans Firebase Console");
                        
                        // Optionnel : envoyer un email de réinitialisation
                        // $this->firebaseRestService->sendPasswordResetEmail($utilisateur->email);
                        
                        // Générer un UID local temporaire
                        $firebaseUid = 'pending_' . uniqid();
                        Log::warning("⚠️ UID temporaire assigné: {$firebaseUid} - Utilisateur doit reset son mdp Firebase");
                    }
                } else {
                    // Essayer de se connecter pour récupérer l'UID existant
                    $signInResult = $this->firebaseRestService->signInAuthUser(
                        $utilisateur->email,
                        $password
                    );
                    
                    if ($signInResult && isset($signInResult['uid'])) {
                        $firebaseUid = $signInResult['uid'];
                        Log::info("✅ Firebase Auth existant: {$utilisateur->email} -> UID: {$firebaseUid}");
                    } else {
                        // Générer un UID local si impossible de créer/récupérer
                        $firebaseUid = 'local_' . uniqid();
                        Log::warning("⚠️ Impossible de créer Firebase Auth pour {$utilisateur->email}, UID local: {$firebaseUid}");
                    }
                }
            }

            // Mettre à jour le firebase_uid dans PostgreSQL
            $utilisateur->firebase_uid = $firebaseUid;

            // Préparer les données pour Firestore
            $firestoreData = $this->prepareFirestoreData($utilisateur, $firebaseUid);

            // Enregistrer dans Firestore via REST API
            $this->firebaseRestService->saveDocument(
                'utilisateurs',
                (string) $utilisateur->id_utilisateur,
                $firestoreData
            );

            // Ajouter le statut de synchronisation dans la collection statut_utilisateurs
            $this->firebaseRestService->saveDocument(
                'statut_utilisateurs',
                (string) $utilisateur->id_utilisateur,
                [
                    'uid' => $firebaseUid,
                    'email' => $utilisateur->email,
                    'etat' => 1,
                    'synchronized' => false,
                    'date' => now()->toIso8601String(),
                    'updatedAt' => now()->toIso8601String()
                ]
            );

            // Mettre à jour le statut de synchronisation
            $utilisateur->synchronized = true;
            $utilisateur->last_sync_at = now();
            $utilisateur->save();

            DB::commit();

            Log::info("✅ Utilisateur {$utilisateur->id_utilisateur} ({$utilisateur->email}) synchronisé - UID: {$firebaseUid}");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("❌ Erreur synchronisation utilisateur {$utilisateur->id_utilisateur}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Préparer les données pour Firestore
     */
    private function prepareFirestoreData(User $utilisateur, $firebaseUid)
    {
        return [
            'id_utilisateur' => $utilisateur->id_utilisateur,
            'firebase_uid' => $firebaseUid,
            'uid' => $firebaseUid,
            'identifiant' => $utilisateur->identifiant,
            'prenom' => $utilisateur->prenom,
            'nom' => $utilisateur->nom,
            'email' => $utilisateur->email,
            'dtn' => $utilisateur->dtn,
            'numero_telephone' => $utilisateur->numero_telephone,
            'sexe' => $utilisateur->sexe ? [
                'id_sexe' => $utilisateur->sexe->id_sexe,
                'libelle' => $utilisateur->sexe->libelle
            ] : null,
            'type_utilisateur' => $utilisateur->typeUtilisateur ? [
                'id_type_utilisateur' => $utilisateur->typeUtilisateur->id_type_utilisateur,
                'libelle' => $utilisateur->typeUtilisateur->libelle
            ] : null,
            'adresse' => $utilisateur->adresse,
            'photo_profil' => $utilisateur->photo_profil,
            'last_sync_at' => now()->toIso8601String(),
            'updatedAt' => now()->toIso8601String()
        ];
    }

    /**
     * Synchroniser les signalements depuis Firebase vers PostgreSQL
     * 
     * @OA\Post(
     *     path="/api/sync/signalements/from-firebase",
     *     summary="Synchroniser les signalements depuis Firebase vers PostgreSQL",
     *     tags={"Synchronisation"},
     *     @OA\Response(
     *         response=200,
     *         description="Synchronisation réussie"
     *     )
     * )
     */
    public function syncSignalementsFromFirebase()
    {
        try {
            // Récupérer les signalements non synchronisés depuis Firestore
            $firestoreSignalements = $this->firebaseRestService->queryCollection('signalements', ['synchronized' => false]);

            if (empty($firestoreSignalements)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Aucun signalement à synchroniser depuis Firebase',
                    'data' => ['total' => 0, 'synced' => 0, 'failed' => 0]
                ]);
            }

            $synced = 0;
            $failed = 0;
            $errors = [];

            foreach ($firestoreSignalements as $firebaseDocId => $signalementData) {
                try {
                    $this->syncSingleSignalementFromFirebase($firebaseDocId, $signalementData);
                    $synced++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = [
                        'firebase_doc_id' => $firebaseDocId,
                        'error' => $e->getMessage()
                    ];
                    Log::error("❌ Erreur sync signalement {$firebaseDocId}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Synchronisation des signalements terminée',
                'data' => [
                    'total' => count($firestoreSignalements),
                    'synced' => $synced,
                    'failed' => $failed,
                    'errors' => $errors
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur synchronisation signalements depuis Firebase: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation des signalements',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser les histo_statuts depuis Firebase vers PostgreSQL
     * 
     * @OA\Post(
     *     path="/api/sync/histo-statuts/from-firebase",
     *     summary="Synchroniser les historiques de statuts depuis Firebase vers PostgreSQL",
     *     tags={"Synchronisation"},
     *     @OA\Response(
     *         response=200,
     *         description="Synchronisation réussie"
     *     )
     * )
     */
    public function syncHistoStatutsFromFirebase()
    {
        try {
            // Récupérer les histo_statuts non synchronisés depuis Firestore
            $firestoreHistoStatuts = $this->firebaseRestService->queryCollection('histo_statuts', ['synchronized' => false]);

            if (empty($firestoreHistoStatuts)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Aucun historique de statut à synchroniser depuis Firebase',
                    'data' => ['total' => 0, 'synced' => 0, 'failed' => 0]
                ]);
            }

            $synced = 0;
            $failed = 0;
            $errors = [];

            foreach ($firestoreHistoStatuts as $firebaseDocId => $histoData) {
                try {
                    $this->syncSingleHistoStatutFromFirebase($firebaseDocId, $histoData);
                    $synced++;
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = [
                        'firebase_doc_id' => $firebaseDocId,
                        'error' => $e->getMessage()
                    ];
                    Log::error("❌ Erreur sync histo_statut {$firebaseDocId}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Synchronisation des historiques de statuts terminée',
                'data' => [
                    'total' => count($firestoreHistoStatuts),
                    'synced' => $synced,
                    'failed' => $failed,
                    'errors' => $errors
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur synchronisation histo_statuts depuis Firebase: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation des historiques de statuts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser tout depuis Firebase (signalements + histo_statuts)
     * 
     * @OA\Post(
     *     path="/api/sync/from-firebase",
     *     summary="Synchroniser tous les signalements et historiques depuis Firebase vers PostgreSQL",
     *     tags={"Synchronisation"},
     *     @OA\Response(
     *         response=200,
     *         description="Synchronisation complète réussie"
     *     )
     * )
     */
    public function syncAllFromFirebase()
    {
        try {
            $results = [
                'signalements' => ['total' => 0, 'synced' => 0, 'failed' => 0, 'errors' => []],
                'histo_statuts' => ['total' => 0, 'synced' => 0, 'failed' => 0, 'errors' => []]
            ];

            // 1. Synchroniser les signalements - récupérer TOUS et filtrer côté PHP
            Log::info("🔄 Début sync signalements depuis Firebase...");
            $allSignalements = $this->firebaseRestService->getCollection('signalements');
            
            // Filtrer les non synchronisés (synchronized = false ou absent)
            $firestoreSignalements = array_filter($allSignalements, function($doc) {
                return !isset($doc['synchronized']) || $doc['synchronized'] === false;
            });
            
            $results['signalements']['total'] = count($firestoreSignalements);
            
            Log::info("📊 Signalements trouvés dans Firebase: " . count($allSignalements) . ", non synchronisés: " . count($firestoreSignalements));

            foreach ($firestoreSignalements as $firebaseDocId => $signalementData) {
                try {
                    Log::info("🔄 Sync signalement: {$firebaseDocId}");
                    $this->syncSingleSignalementFromFirebase($firebaseDocId, $signalementData);
                    $results['signalements']['synced']++;
                } catch (\Exception $e) {
                    $results['signalements']['failed']++;
                    $results['signalements']['errors'][] = [
                        'firebase_doc_id' => $firebaseDocId,
                        'error' => $e->getMessage()
                    ];
                    Log::error("❌ Erreur sync signalement {$firebaseDocId}: " . $e->getMessage());
                }
            }

            // 2. Synchroniser les histo_statuts - récupérer TOUS et filtrer côté PHP
            Log::info("🔄 Début sync histo_statuts depuis Firebase...");
            $allHistoStatuts = $this->firebaseRestService->getCollection('histo_statuts');
            
            // Filtrer les non synchronisés
            $firestoreHistoStatuts = array_filter($allHistoStatuts, function($doc) {
                return !isset($doc['synchronized']) || $doc['synchronized'] === false;
            });
            
            $results['histo_statuts']['total'] = count($firestoreHistoStatuts);
            
            Log::info("📊 HistoStatuts trouvés dans Firebase: " . count($allHistoStatuts) . ", non synchronisés: " . count($firestoreHistoStatuts));

            foreach ($firestoreHistoStatuts as $firebaseDocId => $histoData) {
                try {
                    Log::info("🔄 Sync histo_statut: {$firebaseDocId}");
                    $this->syncSingleHistoStatutFromFirebase($firebaseDocId, $histoData);
                    $results['histo_statuts']['synced']++;
                } catch (\Exception $e) {
                    $results['histo_statuts']['failed']++;
                    $results['histo_statuts']['errors'][] = [
                        'firebase_doc_id' => $firebaseDocId,
                        'error' => $e->getMessage()
                    ];
                    Log::error("❌ Erreur sync histo_statut {$firebaseDocId}: " . $e->getMessage());
                }
            }

            $totalSynced = $results['signalements']['synced'] + $results['histo_statuts']['synced'];
            $totalFailed = $results['signalements']['failed'] + $results['histo_statuts']['failed'];

            Log::info("✅ Sync depuis Firebase terminée: {$totalSynced} réussis, {$totalFailed} échecs");

            return response()->json([
                'success' => true,
                'message' => 'Synchronisation complète depuis Firebase terminée',
                'data' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur synchronisation globale depuis Firebase: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation depuis Firebase',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser un signalement unique depuis Firebase vers PostgreSQL
     */
    private function syncSingleSignalementFromFirebase(string $firebaseDocId, array $signalementData)
    {
        DB::beginTransaction();

        try {
            // Récupérer ou créer le statut
            $idStatut = null;
            if (isset($signalementData['statut'])) {
                $statutData = $signalementData['statut'];
                if (isset($statutData['id_statut'])) {
                    $idStatut = $statutData['id_statut'];
                } elseif (isset($statutData['libelle'])) {
                    $statut = Statut::firstOrCreate(
                        ['libelle' => $statutData['libelle']],
                        ['libelle' => $statutData['libelle']]
                    );
                    $idStatut = $statut->id_statut;
                }
            }

            // Récupérer l'utilisateur par firebase_uid ou id_utilisateur
            $idUtilisateur = null;
            if (isset($signalementData['utilisateur'])) {
                $userData = $signalementData['utilisateur'];
                if (isset($userData['id_utilisateur'])) {
                    $idUtilisateur = $userData['id_utilisateur'];
                } elseif (isset($userData['firebase_uid'])) {
                    $user = User::where('firebase_uid', $userData['firebase_uid'])->first();
                    if ($user) {
                        $idUtilisateur = $user->id_utilisateur;
                    }
                }
            }

            // Préparer le point géographique pour PostgreSQL
            $point = null;
            if (isset($signalementData['point'])) {
                $lat = $signalementData['point']['latitude'] ?? null;
                $lng = $signalementData['point']['longitude'] ?? null;
                if ($lat !== null && $lng !== null) {
                    $point = DB::raw("ST_SetSRID(ST_MakePoint({$lng}, {$lat}), 4326)");
                }
            }

            $city = $signalementData['city'] ?? null;

            // Parser la date
            $daty = null;
            if (isset($signalementData['daty'])) {
                $daty = \Carbon\Carbon::parse($signalementData['daty']);
            }

            // Préparer les données du signalement (sans 'photo' et 'id_statut' qui n'existent pas dans PostgreSQL)
            // Le statut est géré via la table histo_statut
            $signalementFields = [
                'daty' => $daty,
                'surface' => $signalementData['surface'] ?? null,
                'budget' => $signalementData['budget'] ?? null,
                'description' => $signalementData['description'] ?? null,
                'id_utilisateur' => $idUtilisateur,
                'city' => $city,
                'id_entreprise' => $signalementData['id_entreprise'] ?? null,
                'synchronized' => true,
                'last_sync_at' => now()
            ];

            // Créer ou mettre à jour le signalement dans PostgreSQL
            $signalement = null;
            if (isset($signalementData['id_signalement']) && $signalementData['id_signalement']) {
                // Mise à jour d'un signalement existant
                $signalement = Signalement::find($signalementData['id_signalement']);
                if ($signalement) {
                    $signalement->update($signalementFields);
                } else {
                    // Créer avec l'ID spécifié (insertion explicite)
                    $signalementFields['id_signalement'] = $signalementData['id_signalement'];
                    $signalement = Signalement::create($signalementFields);
                }
            } else {
                // Nouveau signalement - laisser PostgreSQL générer l'ID
                $signalement = Signalement::create($signalementFields);
            }

            Log::info("📝 Signalement créé/mis à jour: ID={$signalement->id_signalement}");

            // Mettre à jour le point géographique séparément si nécessaire
            if ($point !== null) {
                DB::table('signalement')
                    ->where('id_signalement', $signalement->id_signalement)
                    ->update(['point' => $point]);
            }

            // Note: Les histo_statuts sont chargés séparément depuis Firestore
            // (pas de création automatique ici)

            // Marquer comme synchronisé dans Firestore
            $this->firebaseRestService->saveDocument(
                'signalements',
                $firebaseDocId,
                array_merge($signalementData, [
                    'synchronized' => true,
                    'id_signalement_postgres' => $signalement->id_signalement,
                    'last_sync_at' => now()->toIso8601String()
                ])
            );

            DB::commit();

            Log::info("✅ Signalement {$firebaseDocId} synchronisé -> PostgreSQL ID: {$signalement->id_signalement}");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("❌ Erreur sync signalement {$firebaseDocId}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Synchroniser un histo_statut unique depuis Firebase vers PostgreSQL
     */
    private function syncSingleHistoStatutFromFirebase(string $firebaseDocId, array $histoData)
    {
        DB::beginTransaction();

        try {
            // Récupérer l'ID du signalement depuis Firebase ou PostgreSQL
            $idSignalement = null;
            
            // Option 1: L'ID PostgreSQL est déjà présent dans les données
            if (isset($histoData['id_signalement_postgres'])) {
                $idSignalement = $histoData['id_signalement_postgres'];
            }
            // Option 2: Chercher via firebase_signalement_id
            elseif (isset($histoData['firebase_signalement_id'])) {
                $signalementFirestore = $this->firebaseRestService->getDocument('signalements', $histoData['firebase_signalement_id']);
                if ($signalementFirestore && isset($signalementFirestore['id_signalement_postgres'])) {
                    $idSignalement = $signalementFirestore['id_signalement_postgres'];
                }
            }
            // Option 3: ID direct
            elseif (isset($histoData['id_signalement'])) {
                $idSignalement = $histoData['id_signalement'];
            }

            if (!$idSignalement) {
                Log::warning("⚠️ Signalement non trouvé pour histo_statut {$firebaseDocId}, sera synchronisé plus tard");
                throw new \Exception("Signalement non encore synchronisé - firebase_signalement_id: " . ($histoData['firebase_signalement_id'] ?? 'null'));
            }

            // Récupérer ou créer le statut
            $idStatut = null;
            if (isset($histoData['statut'])) {
                $statutData = $histoData['statut'];
                if (isset($statutData['id_statut'])) {
                    $idStatut = $statutData['id_statut'];
                } elseif (isset($statutData['libelle'])) {
                    $statut = Statut::firstOrCreate(
                        ['libelle' => $statutData['libelle']],
                        ['libelle' => $statutData['libelle']]
                    );
                    $idStatut = $statut->id_statut;
                }
            }

            // Parser la date
            $daty = null;
            if (isset($histoData['daty'])) {
                $daty = \Carbon\Carbon::parse($histoData['daty']);
            }

            // Préparer les données
            $histoFields = [
                'daty' => $daty,
                'description' => $histoData['description'] ?? null,
                'id_statut' => $idStatut,
                'id_signalement' => $idSignalement,
                'synchronized' => true,
                'last_sync_at' => now()
            ];

            // Créer ou mettre à jour l'histo_statut dans PostgreSQL
            $histoStatut = null;
            if (isset($histoData['id_histo_statut']) && $histoData['id_histo_statut']) {
                $histoStatut = HistoStatut::find($histoData['id_histo_statut']);
                if ($histoStatut) {
                    $histoStatut->update($histoFields);
                } else {
                    $histoFields['id_histo_statut'] = $histoData['id_histo_statut'];
                    $histoStatut = HistoStatut::create($histoFields);
                }
            } else {
                $histoStatut = HistoStatut::create($histoFields);
            }

            Log::info("📝 HistoStatut créé/mis à jour: ID={$histoStatut->id_histo_statut}");

            // Note: Le statut est géré via histo_statut, pas dans la table signalement
            // (la colonne id_statut n'existe pas dans signalement)

            // Marquer comme synchronisé dans Firestore
            $this->firebaseRestService->saveDocument(
                'histo_statuts',
                $firebaseDocId,
                array_merge($histoData, [
                    'synchronized' => true,
                    'id_histo_statut_postgres' => $histoStatut->id_histo_statut,
                    'id_signalement_postgres' => $idSignalement,
                    'last_sync_at' => now()->toIso8601String()
                ])
            );

            DB::commit();

            Log::info("✅ HistoStatut {$firebaseDocId} synchronisé -> PostgreSQL ID: {$histoStatut->id_histo_statut}");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("❌ Erreur sync histo_statut {$firebaseDocId}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Obtenir le statut de synchronisation Firebase -> PostgreSQL
     * 
     * @OA\Get(
     *     path="/api/sync/firebase-status",
     *     summary="Obtenir le statut de synchronisation depuis Firebase",
     *     tags={"Synchronisation"},
     *     @OA\Response(
     *         response=200,
     *         description="Statut de synchronisation Firebase"
     *     )
     * )
     */
    public function firebaseStatus()
    {
        try {
            // Récupérer TOUS les documents et filtrer côté PHP
            $allSignalements = $this->firebaseRestService->getCollection('signalements');
            $allHistoStatuts = $this->firebaseRestService->getCollection('histo_statuts');
            
            // Filtrer les non synchronisés
            $unsyncedSignalements = array_filter($allSignalements, function($doc) {
                return !isset($doc['synchronized']) || $doc['synchronized'] === false;
            });
            $unsyncedHistoStatuts = array_filter($allHistoStatuts, function($doc) {
                return !isset($doc['synchronized']) || $doc['synchronized'] === false;
            });

            // Compter les totaux dans PostgreSQL
            $totalSignalementsPostgres = Signalement::count();
            $totalHistoStatutsPostgres = HistoStatut::count();
            $syncedSignalementsPostgres = Signalement::where('synchronized', true)->count();
            $syncedHistoStatutsPostgres = HistoStatut::where('synchronized', true)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'firebase' => [
                        'signalements_total' => count($allSignalements),
                        'signalements_non_synchronises' => count($unsyncedSignalements),
                        'histo_statuts_total' => count($allHistoStatuts),
                        'histo_statuts_non_synchronises' => count($unsyncedHistoStatuts)
                    ],
                    'postgresql' => [
                        'signalements' => [
                            'total' => $totalSignalementsPostgres,
                            'synchronises' => $syncedSignalementsPostgres
                        ],
                        'histo_statuts' => [
                            'total' => $totalHistoStatutsPostgres,
                            'synchronises' => $syncedHistoStatutsPostgres
                        ]
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du statut Firebase',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser les histo_statuts de PostgreSQL vers Firebase
     * Et mettre à jour le statut du signalement dans Firestore
     * 
     * @OA\Post(
     *     path="/api/sync/histo-statuts/to-firebase",
     *     summary="Synchroniser les histo_statuts vers Firebase",
     *     tags={"Synchronisation"},
     *     @OA\Response(
     *         response=200,
     *         description="Synchronisation réussie"
     *     )
     * )
     */
    public function syncHistoStatutsToFirebase()
    {
        try {
            // Récupérer les histo_statuts non synchronisés depuis PostgreSQL
            // Utiliser whereRaw pour gérer correctement le boolean PostgreSQL
            $histoStatuts = HistoStatut::whereRaw('synchronized = false OR synchronized IS NULL')
                ->with(['statut', 'signalement'])
                ->get();
            
            Log::info("Histo_statuts à synchroniser vers Firebase: " . $histoStatuts->count());
            
            // Debug: lister les IDs
            $ids = $histoStatuts->pluck('id_histo_statut')->toArray();
            Log::info("IDs des histo_statuts: " . implode(', ', $ids));

            if ($histoStatuts->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Aucun histo_statut à synchroniser',
                    'data' => [
                        'total' => 0,
                        'synced' => 0,
                        'failed' => 0,
                        'signalements_updated' => 0
                    ]
                ]);
            }

            $synced = 0;
            $failed = 0;
            $errors = [];
            $signalementsUpdated = [];

            foreach ($histoStatuts as $histoStatut) {
                try {
                    $this->syncSingleHistoStatutToFirebase($histoStatut);
                    $synced++;

                    // Marquer le signalement pour mise à jour du statut
                    if ($histoStatut->id_signalement && !in_array($histoStatut->id_signalement, $signalementsUpdated)) {
                        $signalementsUpdated[] = $histoStatut->id_signalement;
                    }
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = [
                        'id' => $histoStatut->id_histo_statut,
                        'error' => $e->getMessage()
                    ];
                    Log::error("Erreur sync histo_statut {$histoStatut->id_histo_statut} vers Firebase: " . $e->getMessage());
                }
            }

            // Mettre à jour le statut des signalements dans Firestore
            $signalementsStatusUpdated = 0;
            foreach ($signalementsUpdated as $idSignalement) {
                try {
                    $this->updateSignalementStatusInFirestore($idSignalement);
                    $signalementsStatusUpdated++;
                } catch (\Exception $e) {
                    Log::error("Erreur mise à jour statut signalement {$idSignalement}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Synchronisation histo_statuts vers Firebase terminée",
                'data' => [
                    'total' => $histoStatuts->count(),
                    'synced' => $synced,
                    'failed' => $failed,
                    'signalements_updated' => $signalementsStatusUpdated,
                    'errors' => $errors
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur globale sync histo_statuts vers Firebase: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser un seul histo_statut de PostgreSQL vers Firebase
     */
    private function syncSingleHistoStatutToFirebase(HistoStatut $histoStatut)
    {
        DB::beginTransaction();

        try {
            // Récupérer le firebase_signalement_id depuis Firestore
            $firebaseSignalementId = null;
            $allSignalements = $this->firebaseRestService->getCollection('signalements');
            foreach ($allSignalements as $docId => $doc) {
                if (isset($doc['id_signalement_postgres']) && $doc['id_signalement_postgres'] == $histoStatut->id_signalement) {
                    $firebaseSignalementId = $docId;
                    break;
                }
            }

            // Préparer les données pour Firestore - même structure que le mobile
            $firestoreData = [
                'daty' => $histoStatut->daty ? $histoStatut->daty->toIso8601String() : now()->toIso8601String(),
                'description' => $histoStatut->description,
                'firebase_signalement_id' => $firebaseSignalementId,
                'id_histo_statut_postgres' => $histoStatut->id_histo_statut,
                'id_signalement_postgres' => $histoStatut->id_signalement,
                'last_sync_at' => now()->toIso8601String(),
                'statut' => [
                    'id_statut' => $histoStatut->id_statut,
                    'libelle' => $histoStatut->statut ? $histoStatut->statut->libelle : null
                ],
                'synchronized' => true
            ];

            // Enregistrer dans Firestore
            $this->firebaseRestService->saveDocument(
                'histo_statuts',
                (string) $histoStatut->id_histo_statut,
                $firestoreData
            );

            // Mettre à jour le statut dans PostgreSQL
            $histoStatut->synchronized = true;
            $histoStatut->last_sync_at = now();
            $histoStatut->save();

            DB::commit();

            Log::info("✅ Histo_statut {$histoStatut->id_histo_statut} synchronisé vers Firebase");

            // Envoyer une notification de changement de statut à l'utilisateur
            $this->sendStatusChangeNotification($histoStatut);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Envoyer une notification push à l'utilisateur lors du changement de statut
     * 
     * @param HistoStatut $histoStatut L'historique de statut
     * @return void
     */
    private function sendStatusChangeNotification(HistoStatut $histoStatut)
    {
        try {
            // Charger les relations nécessaires
            $histoStatut->load(['signalement.utilisateur', 'statut']);
            
            if (!$histoStatut->signalement || !$histoStatut->signalement->utilisateur) {
                Log::warning("⚠️  Impossible d'envoyer la notification: signalement ou utilisateur non trouvé pour histo_statut {$histoStatut->id_histo_statut}");
                return;
            }
            
            $signalement = $histoStatut->signalement;
            $utilisateur = $signalement->utilisateur;
            $nouveauStatut = $histoStatut->statut ? $histoStatut->statut->libelle : 'Inconnu';
            
            // Préparer les données du signalement pour la notification
            $signalementData = [
                'id_signalement' => $signalement->id_signalement,
                'id_histo_statut' => $histoStatut->id_histo_statut,
                'id_statut' => $histoStatut->id_statut,
                'city' => $signalement->city,
                'description' => $histoStatut->description
            ];
            
            // Envoyer la notification via FCM
            $result = $this->fcmService->notifyStatusChangeWithLocation(
                $utilisateur->id_utilisateur,
                $nouveauStatut,
                $signalementData
            );
            
            if ($result['success']) {
                Log::info("✅ Notification de changement de statut envoyée à l'utilisateur {$utilisateur->id_utilisateur} pour le signalement {$signalement->id_signalement}");
            } else {
                Log::warning("⚠️  Échec d'envoi de notification: {$result['error']}");
            }
            
        } catch (\Exception $e) {
            // Ne pas bloquer la synchronisation si l'envoi de notification échoue
            Log::error("❌ Erreur lors de l'envoi de la notification de changement de statut: " . $e->getMessage());
        }
    }

    /**
     * Mettre à jour le statut d'un signalement dans Firestore avec le dernier statut
     */
    private function updateSignalementStatusInFirestore(int $idSignalement)
    {
        // Récupérer le dernier histo_statut pour ce signalement
        $dernierHistoStatut = HistoStatut::where('id_signalement', $idSignalement)
            ->orderBy('daty', 'desc')
            ->orderBy('id_histo_statut', 'desc')
            ->with('statut')
            ->first();

        if (!$dernierHistoStatut) {
            Log::warning("Aucun histo_statut trouvé pour signalement {$idSignalement}");
            return;
        }

        try {
            // Récupérer tous les signalements de Firestore
            $allSignalements = $this->firebaseRestService->getCollection('signalements');
            
            // Chercher le document qui a id_signalement_postgres = $idSignalement
            $docId = null;
            $existingDoc = null;
            
            foreach ($allSignalements as $id => $doc) {
                if (isset($doc['id_signalement_postgres']) && $doc['id_signalement_postgres'] == $idSignalement) {
                    $docId = $id;
                    $existingDoc = $doc;
                    break;
                }
            }
            
            if ($existingDoc && $docId) {
                // Mettre à jour le champ statut (map) avec le nouveau statut
                $existingDoc['statut'] = [
                    'id_statut' => $dernierHistoStatut->id_statut,
                    'libelle' => $dernierHistoStatut->statut ? $dernierHistoStatut->statut->libelle : null
                ];
                $existingDoc['updatedAt'] = now()->toIso8601String();
                
                $this->firebaseRestService->saveDocument('signalements', $docId, $existingDoc);
                Log::info("✅ Statut du signalement {$idSignalement} (doc: {$docId}) mis à jour dans Firestore: statut.id_statut={$dernierHistoStatut->id_statut}, statut.libelle=" . ($dernierHistoStatut->statut ? $dernierHistoStatut->statut->libelle : 'null'));
            } else {
                Log::warning("Signalement avec id_signalement_postgres={$idSignalement} non trouvé dans Firestore");
            }
        } catch (\Exception $e) {
            Log::error("Erreur mise à jour statut signalement {$idSignalement} dans Firestore: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Synchroniser les paramètres de PostgreSQL vers Firebase
     * 
     * @OA\Post(
     *     path="/api/sync/parametres/to-firebase",
     *     summary="Synchroniser les paramètres vers Firebase",
     *     tags={"Synchronisation"},
     *     @OA\Response(
     *         response=200,
     *         description="Synchronisation réussie"
     *     )
     * )
     */
    public function syncParametresToFirebase()
    {
        try {
            // Récupérer les paramètres non synchronisés
            $parametres = Parametre::whereRaw('synchronized = false OR synchronized IS NULL')
                ->get();

            Log::info("Paramètres à synchroniser: " . $parametres->count());

            if ($parametres->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Aucun paramètre à synchroniser',
                    'data' => [
                        'total' => 0,
                        'synced' => 0,
                        'failed' => 0
                    ]
                ]);
            }

            $synced = 0;
            $failed = 0;
            $errors = [];

            foreach ($parametres as $parametre) {
                try {
                    $this->syncSingleParametreToFirebase($parametre);
                    $synced++;
                    Log::info("✅ Paramètre {$parametre->id_parametre} synchronisé avec succès");
                } catch (\Exception $e) {
                    $failed++;
                    $errors[] = "Paramètre {$parametre->id_parametre}: " . $e->getMessage();
                    Log::error("❌ Erreur sync paramètre {$parametre->id_parametre}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => $failed === 0,
                'message' => 'Synchronisation des paramètres terminée',
                'data' => [
                    'total' => $parametres->count(),
                    'synced' => $synced,
                    'failed' => $failed,
                    'errors' => $errors
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Erreur synchronisation paramètres vers Firebase: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation des paramètres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser un seul paramètre de PostgreSQL vers Firebase
     */
    private function syncSingleParametreToFirebase(Parametre $parametre)
    {
        DB::beginTransaction();

        try {
            // Préparer les données pour Firestore
            $firestoreData = [
                'id_parametre' => $parametre->id_parametre,
                'tentative_max' => $parametre->tentative_max,
                'synchronized' => true,
                'last_sync_at' => now()->toIso8601String(),
                'updatedAt' => now()->toIso8601String()
            ];

            // Enregistrer dans Firestore (remplace l'ancien document s'il existe)
            $this->firebaseRestService->saveDocument(
                'parametre',
                (string) $parametre->id_parametre,
                $firestoreData
            );

            // Mettre à jour le statut dans PostgreSQL
            $parametre->synchronized = true;
            $parametre->last_sync_at = now();
            $parametre->save();

            DB::commit();

            Log::info("✅ Paramètre {$parametre->id_parametre} synchronisé vers Firebase");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("❌ Erreur sync paramètre {$parametre->id_parametre}: " . $e->getMessage());
            throw $e;
        }
    }
}

