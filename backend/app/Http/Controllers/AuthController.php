<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\FirebaseService;
use App\Services\FirestoreService;
use App\Services\SyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Register a new user
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'identifiant' => 'required|string|max:50|unique:utilisateur,identifiant',
            'mdp' => 'required|string|min:6|confirmed',
            'nom' => 'required|string|max:50',
            'prenom' => 'required|string|max:50',
            'dtn' => 'required|date',
            'email' => 'nullable|email|max:50',
            'id_sexe' => 'required|integer|exists:sexe,id_sexe',
            'id_type_utilisateur' => 'required|integer|exists:type_utilisateur,id_type_utilisateur',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // 1. Enregistrer en local d'abord
        $user = User::create([
            'identifiant' => $request->identifiant,
            'mdp' => Hash::make($request->mdp),
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'dtn' => $request->dtn,
            'email' => $request->email,
            'id_sexe' => $request->id_sexe,
            'id_type_utilisateur' => $request->id_type_utilisateur,
            'synchronized' => false,
        ]);

        // 2. Tenter la synchronisation avec Firestore
        $syncService = new SyncService(new FirestoreService());
        $synced = $syncService->syncUser($user);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
            'synchronized' => $synced,
            'sync_message' => $synced 
                ? 'Data synchronized with Firestore' 
                : 'Saved locally, will sync when connection is available'
        ], 201);
    }

    /**
     * Login user and return JWT token
     * RESTRICTION: Seuls les Managers peuvent se connecter sur Web
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'mdp' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = [
            'email' => $request->email,
            'password' => $request->mdp,
        ];

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Vérifier que l'utilisateur est un Manager
        $user = auth('api')->user();
        $typeUtilisateur = DB::table('type_utilisateur')
            ->where('id_type_utilisateur', $user->id_type_utilisateur)
            ->first();

        if (!$typeUtilisateur || $typeUtilisateur->libelle !== 'Manager') {
            auth('api')->logout();
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Only Managers can login on Web.'
            ], 403);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Get authenticated user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        return response()->json([
            'success' => true,
            'user' => auth('api')->user()
        ]);
    }

    /**
     * Logout user (invalidate token)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        auth('api')->logout();

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out'
        ]);
    }

    /**
     * Refresh JWT token
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        $token = auth('api')->refresh();

        return $this->respondWithToken($token);
    }

    /**
     * Get the token array structure
     *
     * @param string $token
     * @return \Illuminate\Http\JsonResponse
     */
    protected function respondWithToken($token)
    {
        return response()->json([
            'success' => true,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => auth('api')->user()
        ]);
    }

    /**
     * Login or register user with Firebase token
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function firebaseAuth(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firebase_token' => 'required|string',
            'nom' => 'nullable|string|max:50',
            'prenom' => 'nullable|string|max:50',
            'dtn' => 'nullable|date',
            'id_sexe' => 'nullable|integer|exists:sexe,id_sexe',
            'id_type_utilisateur' => 'nullable|integer|exists:type_utilisateur,id_type_utilisateur',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $firebaseService = new FirebaseService();
            $verifiedToken = $firebaseService->verifyIdToken($request->firebase_token);
            
            $firebaseUid = $verifiedToken->claims()->get('sub');
            $email = $verifiedToken->claims()->get('email');
            
            // Chercher l'utilisateur par identifiant (Firebase UID) ou email
            $user = User::where('identifiant', $firebaseUid)
                        ->orWhere('email', $email)
                        ->first();

            // Si l'utilisateur n'existe pas, le créer
            if (!$user) {
                $user = User::create([
                    'identifiant' => $firebaseUid,
                    'mdp' => Hash::make(uniqid()), // Mot de passe aléatoire (non utilisé avec Firebase)
                    'nom' => $request->nom ?? 'User',
                    'prenom' => $request->prenom ?? '',
                    'dtn' => $request->dtn ?? now()->subYears(20),
                    'email' => $email,
                    'id_sexe' => $request->id_sexe ?? 1,
                    'id_type_utilisateur' => $request->id_type_utilisateur ?? 1,
                ]);
            } else {
                // Mettre à jour l'identifiant Firebase si nécessaire
                if ($user->identifiant !== $firebaseUid) {
                    $user->update(['identifiant' => $firebaseUid]);
                }
            }

            // Générer le JWT token
            $token = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'message' => 'Firebase authentication successful',
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'user' => $user,
                'firebase_uid' => $firebaseUid
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Firebase authentication failed',
                'error' => $e->getMessage()
            ], 401);
        }
    }
}
