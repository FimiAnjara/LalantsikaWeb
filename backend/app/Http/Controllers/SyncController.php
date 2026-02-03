<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Sexe;
use App\Models\TypeUtilisateur;
use App\Services\Firebase\FirebaseRestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SyncController extends Controller
{
    protected $firebaseRestService;

    public function __construct(FirebaseRestService $firebaseRestService)
    {
        $this->firebaseRestService = $firebaseRestService;
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
}