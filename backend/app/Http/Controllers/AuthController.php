<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Sexe;
use App\Models\TypeUtilisateur;
use App\Models\StatutUtilisateur;
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
     * Authentification via PostgreSQL
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/auth/login",
        summary: "Connexion Manager",
        tags: ["Auth"],
        parameters: [
            new OA\Parameter(name: "email", in: "query", description: "Email de l'utilisateur", required: false, schema: new OA\Schema(type: "string", format: "email", example: "manager@example.com")),
            new OA\Parameter(name: "mdp", in: "query", description: "Mot de passe", required: false, schema: new OA\Schema(type: "string", format: "password", example: "password"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "mdp"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", example: "manager@example.com"),
                    new OA\Property(property: "mdp", type: "string", format: "password", example: "password")
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
        Log::info("💾 Authentification via PostgreSQL");
         
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

        Log::info("✅ Login réussi - Manager: {$user->email}");
        
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
}
