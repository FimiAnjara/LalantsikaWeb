<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Sexe;
use App\Models\TypeUtilisateur;
use App\Models\StatutUtilisateur;
use App\Services\Firebase\FirebaseRestService;
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
    protected $firebaseRestService;

    public function __construct(FirebaseRestService $firebaseRestService)
    {
        $this->firebaseRestService = $firebaseRestService;
    }

    /** 
     * Register a new user (Utilisateur uniquement - pas Manager)
     * Crée l'utilisateur dans PostgreSQL ET Firebase Auth
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
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
        parameters: [
            new OA\Parameter(name: "identifiant", in: "query", required: false, schema: new OA\Schema(type: "string", example: "jdoe")),
            new OA\Parameter(name: "mdp", in: "query", required: false, schema: new OA\Schema(type: "string", format: "password", example: "password123")),
            new OA\Parameter(name: "mdp_confirmation", in: "query", required: false, schema: new OA\Schema(type: "string", format: "password", example: "password123")),
            new OA\Parameter(name: "nom", in: "query", required: false, schema: new OA\Schema(type: "string", example: "Doe")),
            new OA\Parameter(name: "prenom", in: "query", required: false, schema: new OA\Schema(type: "string", example: "John")),
            new OA\Parameter(name: "dtn", in: "query", required: false, schema: new OA\Schema(type: "string", format: "date", example: "1990-01-01")),
            new OA\Parameter(name: "email", in: "query", required: false, schema: new OA\Schema(type: "string", format: "email", example: "john.doe@example.com")),
            new OA\Parameter(name: "id_sexe", in: "query", required: false, schema: new OA\Schema(type: "integer", example: 1))
        ],
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

        DB::beginTransaction();

        try {
            // 1. Créer l'utilisateur dans Firebase Auth
            $firebaseAuth = $this->firebaseRestService->createAuthUser(
                $request->email,
                $request->mdp // Mot de passe en clair
            );

            $firebaseUid = $firebaseAuth['uid'] ?? uniqid('user_');

            // 2. Créer l'utilisateur dans PostgreSQL
            $user = User::create([
                'identifiant' => $request->identifiant,
                'mdp' => Hash::make($request->mdp),
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'dtn' => $request->dtn,
                'email' => $request->email,
                'id_sexe' => $request->id_sexe,
                'id_type_utilisateur' => 2, 
                'firebase_uid' => $firebaseUid,
                'synchronized' => false, // Sera synchronisé ensuite
            ]);

            // 3. Créer le statut utilisateur (etat = 1 = actif)
            StatutUtilisateur::create([
                'id_utilisateur' => $user->id_utilisateur,
                'etat' => 1,
                'date_' => now(),
            ]);

            // 4. Synchroniser vers Firestore
            $firestoreData = $this->prepareUserForFirestore($user);
            $this->firebaseRestService->saveDocument(
                'utilisateurs',
                (string) $user->id_utilisateur,
                $firestoreData
            );

            // 5. Marquer comme synchronisé
            $user->synchronized = true;
            $user->last_sync_at = now();
            $user->save();

            DB::commit();

            Log::info("✅ Utilisateur créé avec succès: {$user->email}, Firebase UID: {$firebaseUid}");

            $token = JWTAuth::fromUser($user);

            return response()->json([
                'code' => 201,
                'success' => true,
                'message' => 'Utilisateur enregistré avec succès',
                'data' => [
                    'user' => $user,
                    'token' => $token,
                    'firebase_uid' => $firebaseUid
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
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
     * Préparer les données utilisateur pour Firestore
     */
    private function prepareUserForFirestore(User $user): array
    {
        return [
            'id_utilisateur' => $user->id_utilisateur,
            'firebase_uid' => $user->firebase_uid,
            'uid' => $user->firebase_uid,
            'identifiant' => $user->identifiant,
            'prenom' => $user->prenom,
            'nom' => $user->nom,
            'email' => $user->email,
            'dtn' => $user->dtn,
            'numero_telephone' => $user->numero_telephone,
            'sexe' => $user->sexe ? [
                'id_sexe' => $user->sexe->id_sexe,
                'libelle' => $user->sexe->libelle
            ] : null,
            'type_utilisateur' => $user->typeUtilisateur ? [
                'id_type_utilisateur' => $user->typeUtilisateur->id_type_utilisateur,
                'libelle' => $user->typeUtilisateur->libelle
            ] : null,
            'adresse' => $user->adresse,
            'photo_profil' => $user->photo_profil,
            'last_sync_at' => now()->toIso8601String(),
            'updatedAt' => now()->toIso8601String()
        ];
    }

    /**
     * Login Manager (Web uniquement)
     * Logique : Firebase token OU credentials PostgreSQL
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/auth/login",
        summary: "Connexion (Manager ou Firebase)",
        tags: ["Auth"],
        parameters: [
            new OA\Parameter(name: "email", in: "query", description: "Email de l'utilisateur", required: false, schema: new OA\Schema(type: "string", format: "email", example: "manager@example.com")),
            new OA\Parameter(name: "mdp", in: "query", description: "Mot de passe", required: false, schema: new OA\Schema(type: "string", format: "password", example: "password")),
            new OA\Parameter(name: "firebase_token", in: "query", description: "Token Firebase ID (optionnel)", required: false, schema: new OA\Schema(type: "string"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "mdp"],
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
        // Si firebase_token est présent, extraire l'email du token JWT
        if ($request->has('firebase_token') && !empty($request->firebase_token)) {
            return $this->loginWithFirebaseToken($request);
        }
        
        // Sinon, authentification directe via PostgreSQL
        return $this->loginPostgres($request);
    }

    /**
     * Login avec Firebase Token (décoder le JWT pour obtenir l'email)
     */
    private function loginWithFirebaseToken(Request $request)
    {
        try {
            $firebaseToken = $request->firebase_token;
            
            // Décoder le JWT pour extraire l'email (sans vérification de signature)
            $tokenParts = explode('.', $firebaseToken);
            if (count($tokenParts) !== 3) {
                Log::warning("❌ Token Firebase invalide (format incorrect)");
                return response()->json([
                    'code' => 401,
                    'success' => false,
                    'message' => 'Token Firebase invalide',
                    'data' => null
                ]);
            }
            
            $payload = json_decode(base64_decode(strtr($tokenParts[1], '-_', '+/')), true);
            $email = $payload['email'] ?? null;
            
            if (!$email) {
                Log::warning("❌ Email non trouvé dans le token Firebase");
                return response()->json([
                    'code' => 401,
                    'success' => false,
                    'message' => 'Email non trouvé dans le token',
                    'data' => null
                ]);
            }
            
            Log::info("🔥 Login via Firebase Token - Email: {$email}");
            
            // Chercher l'utilisateur par email
            $user = User::where('email', $email)->first();
            
            if (!$user) {
                Log::warning("❌ Utilisateur non trouvé: {$email}");
                return response()->json([
                    'code' => 401,
                    'success' => false,
                    'message' => 'Utilisateur non trouvé',
                    'data' => null
                ]);
            }

            // Vérifier que c'est un Manager (id_type_utilisateur = 1)
            if ($user->id_type_utilisateur !== 1) {
                Log::warning("❌ L'utilisateur {$email} n'est pas un Manager");
                return response()->json([
                    'code' => 403,
                    'success' => false,
                    'message' => 'Accès refusé. Seuls les Managers peuvent se connecter sur le Web.',
                    'data' => null
                ]);
            }
            
            // Mettre à jour le firebase_uid si nécessaire
            $firebaseUid = $payload['sub'] ?? $payload['user_id'] ?? null;
            if ($firebaseUid && !$user->firebase_uid) {
                $user->firebase_uid = $firebaseUid;
                $user->save();
            }
            
            // Générer le token JWT
            $token = JWTAuth::fromUser($user);
            
            Log::info("✅ Login réussi via Firebase Token - Manager: {$user->email}");
            
            return $this->respondWithToken($token, $user);
            
        } catch (\Exception $e) {
            Log::error("❌ Erreur Firebase Token: " . $e->getMessage());
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur de traitement du token',
                'data' => ['error' => $e->getMessage()]
            ]);
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
        Log::info("💾 Authentification via PostgreSQL local", [
            'email' => $request->email,
            'identifiant' => $request->identifiant,
            'all_data' => $request->all()
        ]);
        
        // Chercher l'utilisateur par email OU identifiant
        $user = User::where('email', $request->email)
                    ->orWhere('identifiant', $request->email)
                    ->orWhere('email', $request->identifiant)
                    ->orWhere('identifiant', $request->identifiant)
                    ->first();

        if (!$user) {
            Log::warning("❌ Utilisateur non trouvé: email={$request->email}, identifiant={$request->identifiant}");
            return response()->json([
                'code' => 401,
                'success' => false,
                'message' => 'Identifiants invalides',
                'data' => null
            ]);
        }

        // Vérifier le mot de passe
        if (!Hash::check($request->mdp, $user->mdp)) {
            Log::warning("❌ Mot de passe incorrect pour: {$user->email}");
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
            Log::warning("❌ L'utilisateur {$user->email} n'est pas un Manager (type: {$user->id_type_utilisateur})");
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
     * Login or register user with Firebase token (Mobile)
     * Note: Cette méthode est pour l'app mobile qui utilise Firebase Auth
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/auth/firebase",
        summary: "Authentification via Firebase",
        tags: ["Auth"],
        parameters: [
            new OA\Parameter(name: "firebase_token", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "nom", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "prenom", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "dtn", in: "query", required: false, schema: new OA\Schema(type: "string", format: "date")),
            new OA\Parameter(name: "id_sexe", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "id_type_utilisateur", in: "query", required: false, schema: new OA\Schema(type: "integer"))
        ],
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
            'firebase_uid' => 'required|string',
            'email' => 'required|email',
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
            $firebaseUid = $request->firebase_uid;
            $email = $request->email;
            
            Log::info("🔥 Firebase Auth - UID: {$firebaseUid}, Email: {$email}");
            
            // Chercher l'utilisateur par firebase_uid ou email
            $user = User::where('firebase_uid', $firebaseUid)
                        ->orWhere('email', $email)
                        ->first();

            // Si l'utilisateur n'existe pas, le créer
            if (!$user) {
                $user = User::create([
                    'identifiant' => $firebaseUid,
                    'mdp' => Hash::make(uniqid()),
                    'nom' => $request->nom ?? 'User',
                    'prenom' => $request->prenom ?? '',
                    'dtn' => $request->dtn ?? now()->subYears(20),
                    'email' => $email,
                    'id_sexe' => $request->id_sexe ?? 1,
                    'id_type_utilisateur' => $request->id_type_utilisateur ?? 2, // Utilisateur par défaut
                    'firebase_uid' => $firebaseUid,
                ]);
                
                Log::info("✅ Nouvel utilisateur créé via Firebase: {$email}");
            } else {
                // Mettre à jour le firebase_uid si nécessaire
                if (!$user->firebase_uid) {
                    $user->firebase_uid = $firebaseUid;
                    $user->save();
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
            Log::error("❌ Firebase Auth error: " . $e->getMessage());
            return response()->json([
                'code' => 401,
                'success' => false,
                'message' => 'Échec de l\'authentification Firebase',
                'data' => ['error' => $e->getMessage()]
            ], 401);
        }
    }
}
