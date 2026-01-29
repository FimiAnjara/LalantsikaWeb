<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Firebase\AuthService;
use App\Services\Firebase\FirestoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Register a new user (Utilisateur uniquement - pas Manager)
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
            'email' => 'required|email|max:50|unique:utilisateur,email',
            'id_sexe' => 'required|integer|exists:sexe,id_sexe',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'code' => 422,
                'success' => false,
                'message' => 'Validation failed',
                'data' => ['errors' => $validator->errors()]
            ], 422);
        }

        // ÉTAPE 1 : Enregistrer dans PostgreSQL (BASE LOCALE PRIORITAIRE)
        // Forcer le type utilisateur à "Utilisateur" (id = 2)
        $user = User::create([
            'identifiant' => $request->identifiant,
            'mdp' => Hash::make($request->mdp),
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'dtn' => $request->dtn,
            'email' => $request->email,
            'id_sexe' => $request->id_sexe,
            'id_type_utilisateur' => 2, // TOUJOURS Utilisateur
            'synchronized' => false,
        ]);

        $firestoreService = new FirestoreService();
        $firebaseAuthService = new AuthService();
        $synced = false;
        $firebaseUid = null;

        // ÉTAPE 2 : Tester la connexion Firebase
        \Log::info('🔍 Testing Firestore availability...');
        $isFirestoreAvailable = $firestoreService->isAvailable();
        \Log::info('Firestore available: ' . ($isFirestoreAvailable ? 'YES' : 'NO'));

        if ($isFirestoreAvailable) {
            try {
                \Log::info('📝 Creating Firebase Auth user...');
                // 2A. Créer l'utilisateur dans Firebase Authentication
                $firebaseUser = $firebaseAuthService->createUser(
                    $request->email,
                    $request->mdp,
                    [
                        'displayName' => $request->prenom . ' ' . $request->nom
                    ]
                );
                $firebaseUid = $firebaseUser->uid;
                \Log::info("✅ Firebase Auth user created: {$firebaseUid}");

                // 2B. Enregistrer dans Firestore
                \Log::info('📝 Saving to Firestore...');
                $userData = [
                    'id_utilisateur' => $user->id_utilisateur,
                    'identifiant' => $user->identifiant,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'dtn' => $user->dtn ? $user->dtn->format('Y-m-d') : null,
                    'email' => $user->email,
                    'id_sexe' => $user->id_sexe,
                    'id_type_utilisateur' => $user->id_type_utilisateur,
                    'firebase_uid' => $firebaseUid,
                    'last_sync_at' => now()->toIso8601String(),
                ];

                if ($firestoreService->saveToCollection('utilisateurs', $user->id_utilisateur, $userData)) {
                    // Marquer comme synchronisé
                    $user->update([
                        'synchronized' => true,
                        'last_sync_at' => now(),
                        'firebase_uid' => $firebaseUid
                    ]);
                    $synced = true;
                    \Log::info("✅ User {$user->id_utilisateur} synchronized with Firestore & Auth");
                } else {
                    \Log::error("❌ Failed to save to Firestore collection");
                }
            } catch (\Exception $e) {
                \Log::error("❌ Firebase sync failed: " . $e->getMessage());
                \Log::error("Stack trace: " . $e->getTraceAsString());
            }
        } else {
            \Log::warning("⚠️ Firebase indisponible - User {$user->id_utilisateur} non synchronisé");
        }

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'code' => 201,
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => $user,
                'token' => $token,
                'synchronized' => $synced,
                'firebase_uid' => $firebaseUid,
                'sync_message' => $synced 
                    ? 'Data synchronized with Firestore & Firebase Auth' 
                    : 'Saved locally, will sync when connection is available'
            ]
        ], 201);
    }

    /**
     * Login Manager (Web uniquement)
     * Logique : Firebase en priorité, sinon PostgreSQL local
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firebase_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'code' => 422,
                'success' => false,
                'message' => 'Validation failed',
                'data' => ['errors' => $validator->errors()]
            ], 422);
        }

        $firestoreService = new FirestoreService();
        $firebaseAuthService = new AuthService();
        
        try {
            \Log::info("🔥 Vérification du Firebase ID Token...");
            
            // ÉTAPE 1 : Vérifier le token Firebase
            $verifiedToken = $firebaseAuthService->verifyIdToken($request->firebase_token);
            $firebaseUid = $verifiedToken->claims()->get('sub');
            $email = $verifiedToken->claims()->get('email');
            
            \Log::info("✅ Token vérifié - UID: {$firebaseUid}, Email: {$email}");
            
            // ÉTAPE 2 : Récupérer l'utilisateur depuis Firestore
            $firestoreUser = $firestoreService->getFromCollectionByField('utilisateurs', 'email', $email);
            
            if (!$firestoreUser) {
                \Log::warning("❌ User not found in Firestore for email: {$email}");
                return response()->json([
                    'code' => 401,
                    'success' => false,
                    'message' => 'User not found in database',
                    'data' => null
                ], 401);
            }
            
            // ÉTAPE 3 : Vérifier que c'est un Manager (id_type_utilisateur = 1)
            if (!isset($firestoreUser['id_type_utilisateur']) || $firestoreUser['id_type_utilisateur'] != 1) {
                \Log::warning("❌ User is not a Manager (id_type_utilisateur: " . ($firestoreUser['id_type_utilisateur'] ?? 'null') . ")");
                return response()->json([
                    'code' => 403,
                    'success' => false,
                    'message' => 'Access denied. Only Managers can login on Web.',
                    'data' => null
                ], 403);
            }
            
            // ÉTAPE 4 : Créer un objet User pour JWT
            $user = new User();
            $user->id_utilisateur = $firestoreUser['id_utilisateur'] ?? null;
            $user->identifiant = $firestoreUser['identifiant'] ?? '';
            $user->nom = $firestoreUser['nom'] ?? '';
            $user->prenom = $firestoreUser['prenom'] ?? '';
            $user->email = $firestoreUser['email'] ?? $email;
            $user->id_type_utilisateur = $firestoreUser['id_type_utilisateur'];
            $user->id_sexe = $firestoreUser['id_sexe'] ?? null;
            $user->firebase_uid = $firebaseUid;
            
            $token = JWTAuth::fromUser($user);
            \Log::info("✅ Login successful via Firebase - Manager: {$user->email}");
            
            return $this->respondWithToken($token, $user);
            
        } catch (\Exception $e) {
            \Log::error("🔴 Firebase token verification failed: " . $e->getMessage());
            return $this->loginPostgres($request);
        }
    }

    /**
     * Login via PostgreSQL local
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    private function loginPostgres(Request $request)
    {
        \Log::info("💾 Authentification via PostgreSQL local");
         
        // Chercher l'utilisateur par email
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->mdp, $user->mdp)) {
            return response()->json([
                'code' => 401,
                'success' => false,
                'message' => 'Invalid credentials',
                'data' => null
            ], 401);
        }

        // Vérifier que l'utilisateur est un Manager
        $typeUtilisateur = DB::table('type_utilisateur')
            ->where('id_type_utilisateur', $user->id_type_utilisateur)
            ->first();

        if (!$typeUtilisateur || $typeUtilisateur->libelle !== 'Manager') {
            return response()->json([
                'code' => 403,
                'success' => false,
                'message' => 'Access denied. Only Managers can login on Web.',
                'data' => null
            ], 403);
        }

        // Générer le token JWT
        $token = JWTAuth::fromUser($user);

        \Log::info("✅ Login réussi via PostgreSQL - Manager: {$user->email}");
        
        return $this->respondWithToken($token, $user);
    }

    /**
     * Get authenticated user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        return response()->json([
            'code' => 200,
            'success' => true,
            'message' => 'User retrieved successfully',
            'data' => ['user' => auth('api')->user()]
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
            'code' => 200,
            'success' => true,
            'message' => 'Successfully logged out',
            'data' => null
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
     * @param User|null $user
     * @return \Illuminate\Http\JsonResponse
     */
    protected function respondWithToken($token, $user = null)
    {
        return response()->json([
            'code' => 200,
            'success' => true,
            'message' => 'Authentication successful',
            'data' => [
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => auth('api')->factory()->getTTL() * 60,
                'user' => $user ?? auth('api')->user()
            ]
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
                'code' => 422,
                'success' => false,
                'message' => 'Validation failed',
                'data' => ['errors' => $validator->errors()]
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
                'code' => 200,
                'success' => true,
                'message' => 'Firebase authentication successful',
                'data' => [
                    'access_token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => auth('api')->factory()->getTTL() * 60,
                    'user' => $user,
                    'firebase_uid' => $firebaseUid
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'code' => 401,
                'success' => false,
                'message' => 'Firebase authentication failed',
                'data' => ['error' => $e->getMessage()]
            ], 401);
        }
    }
}
