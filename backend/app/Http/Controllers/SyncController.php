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
     *     @OA\Response(
     *         response=200,
     *         description="Synchronisation réussie"
     *     )
     * )
     */
    public function synchroniserUtilisateurs()
    {
        try {
            // Récupérer les utilisateurs non synchronisés
            $utilisateurs = User::where('synchronized', false)
                ->orWhereNull('synchronized')
                ->orWhereNull('firebase_uid')
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
                    $this->syncSingleUser($utilisateur);
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
     *     @OA\Response(
     *         response=200,
     *         description="Utilisateur synchronisé"
     *     )
     * )
     */
    public function synchroniserUtilisateur($id)
    {
        try {
            $utilisateur = User::with(['sexe', 'typeUtilisateur'])->find($id);

            if (!$utilisateur) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé'
                ], 404);
            }

            $this->syncSingleUser($utilisateur);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur synchronisé avec succès',
                'data' => [
                    'id_utilisateur' => $utilisateur->id_utilisateur,
                    'firebase_uid' => $utilisateur->firebase_uid,
                    'last_sync_at' => $utilisateur->last_sync_at
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
    public function forceSync()
    {
        try {
            // Réinitialiser le statut de synchronisation
            User::query()->update(['synchronized' => false]);

            // Lancer la synchronisation
            return $this->synchroniserUtilisateurs();

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la re-synchronisation forcée',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser un utilisateur unique vers Firebase
     */
    private function syncSingleUser(User $utilisateur)
    {
        DB::beginTransaction();

        try {
            // Générer un firebase_uid s'il n'existe pas
            if (empty($utilisateur->firebase_uid)) {
                $utilisateur->firebase_uid = uniqid('user_');
            }

            // Préparer les données pour Firebase Realtime Database
            $firestoreData = $this->prepareFirestoreData($utilisateur, $utilisateur->firebase_uid);

            // Enregistrer dans Firebase via REST API
            $this->firebaseRestService->saveDocument(
                'utilisateurs',
                (string) $utilisateur->id_utilisateur,
                $firestoreData
            );

            // Mettre à jour le statut de synchronisation
            $utilisateur->synchronized = true;
            $utilisateur->last_sync_at = now();
            $utilisateur->save();

            DB::commit();

            Log::info("Utilisateur {$utilisateur->id_utilisateur} synchronisé avec succès vers Firebase");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur synchronisation utilisateur {$utilisateur->id_utilisateur}: " . $e->getMessage());
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
            'identifiant' => $utilisateur->identifiant,
            'prenom' => $utilisateur->prenom,
            'nom' => $utilisateur->nom,
            'email' => $utilisateur->email,
            'dtn' => $utilisateur->dtn,
            'numero_telephone' => $utilisateur->numero_telephone,
            'sexe' => $utilisateur->sexe?->libelle,
            'type_utilisateur' => $utilisateur->typeUtilisateur?->libelle,
            'adresse' => $utilisateur->adresse,
            'photo_profil' => $utilisateur->photo_profil,
            'created_at' => $utilisateur->created_at?->toIso8601String(),
            'updated_at' => $utilisateur->updated_at?->toIso8601String()
        ];
    }
}