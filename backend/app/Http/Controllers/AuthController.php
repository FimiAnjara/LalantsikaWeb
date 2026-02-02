<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Sexe;
use App\Models\TypeUtilisateur;
use App\Models\StatutUtilisateur;
use App\Services\Firebase\AuthService;
use App\Services\Firebase\FirestoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Log;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Auth",
    description: "Authentification et gestion de session"
)]
class AuthController extends Controller
{
    /** 
     * Register a new user (Utilisateur uniquement - pas Manager)
     * Enregistrement PostgreSQL uniquement
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/auth/register",
        summary: "Inscription d'un nouvel utilisateur",
        tags: ["Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["identifiant", "mdp", "mdp_confirmation", "nom", "prenom", "dtn", "email", "id_sexe"],
                properties: [
                    new OA\Property(property: "identifiant", type: "string", example: "jdoe"),
                    new OA\Property(property: "mdp", type: "string", format: "password", example: "password123"),
                    new OA\Property(property: "mdp_confirmation", type: "string", format: "password", example: "password123"),
                    new OA\Property(property: "nom", type: "string", example: "Doe"),
                    new OA\Property(property: "prenom", type: "string", example: "John"),
                    new OA\Property(property: "dtn", type: "string", format: "date", example: "1990-01-01"),
                    new OA\Property(property: "email", type: "string", format: "email", example: "john.doe@example.com"),
                    new OA\Property(property: "id_sexe", type: "integer", example: 1)
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Utilisateur créé avec succès"),
            new OA\Response(response: 422, description: "Erreur de validation")
        ]
    )]
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
                'message' => 'Échec de la validation',
                'data' => ['errors' => $validator->errors()]
            ]);
        }

        try {
            // Créer l'utilisateur dans PostgreSQL
            $user = User::create([
                'identifiant' => $request->identifiant,
                'mdp' => Hash::make($request->mdp),
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'dtn' => $request->dtn,
                'email' => $request->email,
                'id_sexe' => $request->id_sexe,
                'id_type_utilisateur' => 2, 
            ]);

            // Créer le statut utilisateur (etat = 1 = actif)
            StatutUtilisateur::create([
                'id_utilisateur' => $user->id_utilisateur,
                'etat' => 1,
                'date_' => now(),
            ]);

            Log::info("✅ Utilisateur créé avec succès: {$user->email}");

            $token = JWTAuth::fromUser($user);

            return response()->json([
                'code' => 201,
                'success' => true,
                'message' => 'Utilisateur enregistré avec succès',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Erreur lors de la création de l'utilisateur: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la création de l\'utilisateur',
                'data' => ['error' => $e->getMessage()]
            ]);
        }
    }
       

    /**
     * Login Manager (Web uniquement)
     * Logique : Firebase en priorité, sinon PostgreSQL local
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/auth/login",
        summary: "Connexion (Manager ou Firebase)",
        tags: ["Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", example: "manager@example.com"),
                    new OA\Property(property: "mdp", type: "string", format: "password", example: "password"),
                    new OA\Property(property: "firebase_token", type: "string", description: "Token Firebase ID (optionnel)")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Connexion réussie"),
            new OA\Response(response: 401, description: "Identifiants invalides"),
            new OA\Response(response: 403, description: "Accès refusé")
        ]
    )]
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firebase_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->loginPostgres($request);
        }

        $firestoreService = new FirestoreService();
        $firebaseAuthService = new AuthService();
        
        try {
            Log::info("🔥 Vérification du Firebase ID Token...");
            
            // ÉTAPE 1 : Vérifier le token Firebase
            $verifiedToken = $firebaseAuthService->verifyIdToken($request->firebase_token);
            $firebaseUid = $verifiedToken->claims()->get('sub');
            $email = $verifiedToken->claims()->get('email');
            
            Log::info("✅ Token vérifié - UID: {$firebaseUid}, Email: {$email}");
            
            // ÉTAPE 2 : Récupérer l'utilisateur depuis Firestore
            $firestoreUser = $firestoreService->getFromCollectionByField('utilisateurs', 'email', $email);
            
            if (!$firestoreUser) {
                Log::warning("⚠️ User not found in Firestore for email: {$email} - Trying PostgreSQL fallback...");
                
                // FALLBACK : Chercher dans PostgreSQL
                $user = User::where('email', $email)->first();
                
                if (!$user) {
                    Log::warning("❌ User not found in PostgreSQL either for email: {$email}");
                    return response()->json([
                        'code' => 401,
                        'success' => false,
                        'message' => 'Utilisateur non trouvé dans la base de données',
                        'data' => null
                    ]);
                }
                
                // Vérifier que c'est un Manager (id_type_utilisateur = 1)
                if ($user->id_type_utilisateur != 1) {
                    Log::warning("❌ User is not a Manager (id_type_utilisateur: {$user->id_type_utilisateur})");
                    return response()->json([
                        'code' => 403,
                        'success' => false,
                        'message' => 'Accès refusé. Seuls les Managers peuvent se connecter sur le Web.',
                        'data' => null
                    ]);
                }
                
                // Mettre à jour le firebase_uid si nécessaire
                if (!$user->firebase_uid) {
                    $user->firebase_uid = $firebaseUid;
                    $user->save();
                }
                
                $token = JWTAuth::fromUser($user);
                Log::info("✅ Login successful via PostgreSQL fallback - Manager: {$user->email}");
                
                return $this->respondWithToken($token, $user);
            }
            
            // ÉTAPE 3 : Vérifier que c'est un Manager (id_type_utilisateur = 1)
            if (!isset($firestoreUser['type_utilisateur']['id_type_utilisateur']) || $firestoreUser['type_utilisateur']['id_type_utilisateur'] != 1) {
                Log::warning("❌ User is not a Manager (id_type_utilisateur: " . ($firestoreUser['id_type_utilisateur'] ?? 'null') . ")");
                return response()->json([
                    'code' => 403,
                    'success' => false,
                    'message' => 'Accès refusé. Seuls les Managers peuvent se connecter sur le Web.',
                    'data' => null
                ]);
            }
            
            // ÉTAPE 4 : Chercher ou créer l'utilisateur dans PostgreSQL
            $user = User::where('email', $email)->first();
            
            if (!$user) {
                // Créer l'utilisateur dans PostgreSQL s'il n'existe pas
                $user = User::create([
                    'identifiant' => $firestoreUser['identifiant'] ?? $firebaseUid,
                    'mdp' => Hash::make(uniqid()), // Mot de passe temporaire
                    'nom' => $firestoreUser['nom'] ?? '',
                    'prenom' => $firestoreUser['prenom'] ?? '',
                    'dtn' => isset($firestoreUser['dtn']) ? $firestoreUser['dtn'] : now()->subYears(25),
                    'email' => $email,
                    'id_sexe' => $firestoreUser['sexe']['id_sexe'] ?? 1,
                    'id_type_utilisateur' => $firestoreUser['type_utilisateur']['id_type_utilisateur'],
                    'firebase_uid' => $firebaseUid,
                ]);
                Log::info("✅ User created in PostgreSQL from Firestore: {$user->email}");
            } else {
                // Mettre à jour le firebase_uid si nécessaire
                if (!$user->firebase_uid) {
                    $user->firebase_uid = $firebaseUid;
                    $user->save();
                }
            }
            
            $token = JWTAuth::fromUser($user);
            Log::info("✅ Login successful via Firebase - Manager: {$user->email}");
            
            return $this->respondWithToken($token, $user);
            
        } catch (\Exception $e) {
            Log::error("🔴 Firebase token verification failed: " . $e->getMessage());
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
        Log::info("💾 Authentification via PostgreSQL local");
         
        // Chercher l'utilisateur par email
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->mdp, $user->mdp)) {
            return response()->json([
                'code' => 401,
                'success' => false,
                'message' => 'Identifiants invalides',
                'data' => null
            ]);
        }

        // Vérifier que l'utilisateur est un Manager
        $typeUtilisateur = DB::table('type_utilisateur')
            ->where('id_type_utilisateur', $user->id_type_utilisateur)
            ->first();

        if (!$typeUtilisateur || $typeUtilisateur->id_type_utilisateur !== 1) {
            return response()->json([
                'code' => 403,
                'success' => false,
                'message' => 'Accès refusé. Seuls les Managers peuvent se connecter sur le Web.',
                'data' => null
            ]);
        }

        // Générer le token JWT
        $token = JWTAuth::fromUser($user);

        Log::info("✅ Login réussi via PostgreSQL - Manager: {$user->email}");
        
        return $this->respondWithToken($token, $user);
    }

    /**
     * Get authenticated user
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/auth/me",
        summary: "Récupérer l'utilisateur connecté",
        tags: ["Auth"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Détails de l'utilisateur"),
            new OA\Response(response: 401, description: "Non authentifié")
        ]
    )]
    public function me()
    {
        return response()->json([
            'code' => 200,
            'success' => true,
            'message' => 'Utilisateur récupéré avec succès',
            'data' => ['user' => auth('api')->user()]
        ]);
    }

    /**
     * Logout user (invalidate token)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/auth/logout",
        summary: "Déconnexion",
        tags: ["Auth"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Déconnexion réussie"),
            new OA\Response(response: 401, description: "Non authentifié")
        ]
    )]
    public function logout()
    {
        auth('api')->logout();

        return response()->json([
            'code' => 200,
            'success' => true,
            'message' => 'Déconnexion réussie',
            'data' => null
        ]);
    }

    /**
     * Refresh JWT token
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/auth/refresh",
        summary: "Rafraîchir le token",
        tags: ["Auth"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Nouveau token généré"),
            new OA\Response(response: 401, description: "Non authentifié")
        ]
    )]
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
            'message' => 'Authentification réussie',
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
    #[OA\Post(
        path: "/auth/firebase",
        summary: "Authentification via Firebase",
        tags: ["Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["firebase_token"],
                properties: [
                    new OA\Property(property: "firebase_token", type: "string"),
                    new OA\Property(property: "nom", type: "string"),
                    new OA\Property(property: "prenom", type: "string"),
                    new OA\Property(property: "dtn", type: "string", format: "date"),
                    new OA\Property(property: "id_sexe", type: "integer"),
                    new OA\Property(property: "id_type_utilisateur", type: "integer")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Authentification réussie"),
            new OA\Response(response: 401, description: "Token invalide"),
            new OA\Response(response: 422, description: "Erreur de validation")
        ]
    )]
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
                'message' => 'Échec de la validation',
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
                'message' => 'Authentification Firebase réussie',
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
                'message' => 'Échec de l\'authentification Firebase',
                'data' => ['error' => $e->getMessage()]
            ], 401);
        }
    }
}
