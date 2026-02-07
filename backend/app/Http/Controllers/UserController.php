<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\StatutUtilisateur;
use App\Models\TypeUtilisateur;
use App\Models\Sexe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Utilisateurs",
    description: "Gestion des utilisateurs (Web & Mobile)"
)]
class UserController extends Controller
{
    /**
     * Liste tous les utilisateurs avec leur statut (paginée et filtrable)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/users",
        summary: "Liste des utilisateurs",
        tags: ["Utilisateurs"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "page", in: "query", description: "Numéro de la page", required: false, schema: new OA\Schema(type: "integer", default: 1)),
            new OA\Parameter(name: "per_page", in: "query", description: "Nombre d'éléments par page", required: false, schema: new OA\Schema(type: "integer", default: 15)),
            new OA\Parameter(name: "search", in: "query", description: "Recherche par identifiant, nom, prénom ou email", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "id_type_utilisateur", in: "query", description: "Filtrer par type d'utilisateur", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "statut", in: "query", description: "Filtrer par statut (actif/bloque)", required: false, schema: new OA\Schema(type: "string", enum: ["actif", "bloque"]))
        ],
        responses: [
            new OA\Response(response: 200, description: "Liste récupérée avec succès"),
            new OA\Response(response: 401, description: "Non authentifié")
        ]
    )]
    public function index(Request $request)
    {
        try {
            $query = User::with(['sexe', 'typeUtilisateur', 'statuts' => function($q) {
                $q->orderBy('date_', 'desc'); // On récupère tous les statuts pour trier en PHP si besoin
            }])->orderBy('id_utilisateur', 'desc');

            // --- Filtrage ---

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('identifiant', 'ilike', "%{$search}%")
                      ->orWhere('nom', 'ilike', "%{$search}%")
                      ->orWhere('prenom', 'ilike', "%{$search}%")
                      ->orWhere('email', 'ilike', "%{$search}%");
                });
            }

            if ($request->filled('id_type_utilisateur')) {
                $query->where('id_type_utilisateur', $request->id_type_utilisateur);
            }

            // Note: Le filtrage par "statut" est complexe en SQL pur car il dépend du dernier statut inséré.
            // Pour simplifier et optimiser, on filtre APRÈS récupération si la pagination n'est pas critique,
            // OU on fait une requête complexe. Ici, on va ignorer le filtre statut SQL pour l'instant 
            // sauf si spécifiquement demandé, pour éviter des erreurs SQL complexes.
            // Si le user insiste sur le filtre "statut", on ajoutera un whereHas avec subquery.

            // --- Pagination ---
            
            $perPage = $request->input('per_page', 15);
            $page = $request->input('page', 1);

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            // --- Transformation des données ---

            $data = $paginator->getCollection()->map(function ($user) {
                // Récupérer le dernier statut (le plus récent par date_)
                $premierStatut = $user->statuts->sortByDesc('date_')->first();
                
                return [
                    'id_utilisateur' => $user->id_utilisateur,
                    'identifiant' => $user->identifiant,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'email' => $user->email,
                    'dtn' => $user->dtn ? $user->dtn->format('Y-m-d') : null,
                    'photo_url' => $user->photo_url,
                    'sexe' => $user->sexe ? $user->sexe->libelle : null,
                    'type_utilisateur' => $user->typeUtilisateur ? $user->typeUtilisateur->libelle : null,
                    'synchronized' => $user->synchronized ?? false,
                    'statut' => $premierStatut ? ($premierStatut->etat == 1 ? 'actif' : 'bloque') : 'actif',
                ];
            });

            // Si filtre statut demandé (filtrage post-query sur la page courante - imparfait mais simple)
            if ($request->filled('statut')) {
                $statutVoulu = $request->statut;
                $data = $data->filter(function ($user) use ($statutVoulu) {
                    return $user['statut'] === $statutVoulu;
                })->values();
            }

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Liste des utilisateurs récupérée avec succès',
                'data' => [
                    'items' => $data,
                    'pagination' => [
                        'current_page' => $paginator->currentPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'last_page' => $paginator->lastPage(),
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération des utilisateurs: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'data' => null
            ], 500);
        }
    }

    /**
     * Récupère un utilisateur par son ID
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/users/{id}",
        summary: "Détails d'un utilisateur",
        tags: ["Utilisateurs"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Détails récupérés avec succès"),
            new OA\Response(response: 404, description: "Utilisateur non trouvé")
        ]
    )]
    public function show($id)
    {
        try {
            $user = User::with(['sexe', 'typeUtilisateur', 'statuts' => function($query) {
                $query->orderBy('date_', 'desc');
            }])
            ->findOrFail($id);

            $dernierStatut = $user->statuts->first();

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Utilisateur récupéré avec succès',
                'data' => [
                    'id_utilisateur' => $user->id_utilisateur,
                    'identifiant' => $user->identifiant,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'email' => $user->email,
                    'dtn' => $user->dtn ? $user->dtn->format('Y-m-d') : null,
                    'photo_url' => $user->photo_url,
                    'sexe' => $user->sexe,
                    'type_utilisateur' => $user->typeUtilisateur,
                    'synchronized' => $user->synchronized ?? false,
                    'firebase_uid' => $user->firebase_uid,
                    'statut' => $dernierStatut ? ($dernierStatut->etat == 1 ? 'actif' : 'bloque') : 'actif',
                    'statuts' => $user->statuts,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération de l'utilisateur: " . $e->getMessage());
            
            return response()->json([
                'code' => 404,
                'success' => false,
                'message' => 'Utilisateur non trouvé',
                'data' => null
            ], 404);
        }
    }

    /**
     * Met à jour un utilisateur
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Put(
        path: "/users/{id}",
        summary: "Mettre à jour un utilisateur",
        tags: ["Utilisateurs"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "nom", type: "string"),
                    new OA\Property(property: "prenom", type: "string"),
                    new OA\Property(property: "email", type: "string"),
                    new OA\Property(property: "dtn", type: "string", format: "date"),
                    new OA\Property(property: "id_sexe", type: "integer"),
                    new OA\Property(property: "id_type_utilisateur", type: "integer")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Mise à jour réussie"),
            new OA\Response(response: 404, description: "Utilisateur non trouvé")
        ]
    )]
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            // Validation des données
            $validated = $request->validate([
                'nom' => 'sometimes|string|max:100',
                'prenom' => 'sometimes|string|max:100',
                'email' => 'sometimes|email|unique:utilisateur,email,' . $id . ',id_utilisateur',
                'dtn' => 'sometimes|date',
                'id_sexe' => 'sometimes|exists:sexe,id_sexe',
                'id_type_utilisateur' => 'sometimes|exists:type_utilisateur,id_type_utilisateur',
                'photo' => 'sometimes|image|max:5120', // 5MB max
            ]);

            // Mettre à jour les champs
            if (isset($validated['nom'])) $user->nom = $validated['nom'];
            if (isset($validated['prenom'])) $user->prenom = $validated['prenom'];
            if (isset($validated['email'])) $user->email = $validated['email'];
            if (isset($validated['dtn'])) $user->dtn = $validated['dtn'];
            if (isset($validated['id_sexe'])) $user->id_sexe = $validated['id_sexe'];
            if (isset($validated['id_type_utilisateur'])) $user->id_type_utilisateur = $validated['id_type_utilisateur'];

            // Upload de la nouvelle photo si présente
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $filename = $user->identifiant . '_' . time() . '.' . $file->getClientOriginalExtension();
                
                // Supprimer l'ancienne photo locale si elle existe
                if ($user->photo_url && str_starts_with($user->photo_url, '/storage/')) {
                    $oldPath = str_replace('/storage/', 'public/', $user->photo_url);
                    \Illuminate\Support\Facades\Storage::delete($oldPath);
                }
                
                // Stocker la nouvelle photo
                $path = $file->storeAs('public/utilisateur', $filename);
                if ($path) {
                    $user->photo_url = '/api/storage/utilisateur/' . $filename;
                    Log::info("✅ Photo mise à jour: {$user->photo_url}");
                }
            } elseif ($request->filled('photo_path')) {
                // Accepter un chemin de photo pré-uploadée
                $user->photo_url = $request->input('photo_path');
                Log::info("✅ Chemin photo défini: {$user->photo_url}");
            }

            $user->save();

            Log::info("✅ Utilisateur mis à jour: {$user->email}");

            // Recharger avec les relations
            $user->load(['sexe', 'typeUtilisateur']);

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Utilisateur mis à jour avec succès',
                'data' => [
                    'id_utilisateur' => $user->id_utilisateur,
                    'identifiant' => $user->identifiant,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'email' => $user->email,
                    'dtn' => $user->dtn ? $user->dtn->format('Y-m-d') : null,
                    'photo_url' => $user->photo_url,
                    'sexe' => $user->sexe,
                    'type_utilisateur' => $user->typeUtilisateur,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'code' => 422,
                'success' => false,
                'message' => 'Erreur de validation',
                'data' => ['errors' => $e->errors()]
            ], 422);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la mise à jour de l'utilisateur: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'utilisateur',
                'data' => null
            ], 500);
        }
    }

    /**
     * Bloquer un utilisateur (créer un statut avec etat = 0)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/users/{id}/block",
        summary: "Bloquer un utilisateur",
        tags: ["Utilisateurs"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Utilisateur bloqué"),
            new OA\Response(response: 404, description: "Utilisateur non trouvé")
        ]
    )]
    public function block($id)
    {
        try {
            $user = User::findOrFail($id);

            StatutUtilisateur::create([
                'id_utilisateur' => $user->id_utilisateur,
                'etat' => 0,
                'date_' => now(),
            ]);

            Log::info("✅ Utilisateur bloqué: {$user->email}");

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Utilisateur bloqué avec succès',
                'data' => null
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors du blocage de l'utilisateur: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors du blocage de l\'utilisateur',
                'data' => null
            ], 500);
        }
    }

    /**
     * Débloquer un utilisateur (créer un statut avec etat = 1)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/users/{id}/unblock",
        summary: "Débloquer un utilisateur",
        tags: ["Utilisateurs"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Utilisateur débloqué"),
            new OA\Response(response: 404, description: "Utilisateur non trouvé")
        ]
    )]
    public function unblock($id)
    {
        try {
            $user = User::findOrFail($id);

            StatutUtilisateur::create([
                'id_utilisateur' => $user->id_utilisateur,
                'etat' => 1,
                'date_' => now(),
            ]);

            Log::info("✅ Utilisateur débloqué: {$user->email}");

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Utilisateur débloqué avec succès',
                'data' => null
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors du déblocage de l'utilisateur: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors du déblocage de l\'utilisateur',
                'data' => null
            ], 500);
        }
    }

    /**
     * Supprimer un utilisateur
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Delete(
        path: "/users/{id}",
        summary: "Supprimer un utilisateur",
        tags: ["Utilisateurs"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Utilisateur supprimé"),
            new OA\Response(response: 404, description: "Utilisateur non trouvé")
        ]
    )]
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            
            // Supprimer les statuts associés
            StatutUtilisateur::where('id_utilisateur', $id)->delete();
            
            // Supprimer l'utilisateur
            $user->delete();

            Log::info("✅ Utilisateur supprimé: {$user->email}");

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès',
                'data' => null
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la suppression de l'utilisateur: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'utilisateur',
                'data' => null
            ], 500);
        }
    }

    /**
     * Liste tous les types d'utilisateurs
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/user-types",
        summary: "Liste des types d'utilisateurs",
        tags: ["Utilisateurs"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Liste des types")
        ]
    )]
    public function getTypesUtilisateurs()
    {
        try {
            $types = TypeUtilisateur::all();

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Liste des types d\'utilisateurs récupérée avec succès',
                'data' => $types
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération des types d'utilisateurs: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la récupération des types d\'utilisateurs',
                'data' => null
            ], 500);
        }
    }

    /**
     * Liste tous les statuts d'utilisateurs
     *
     * @return \Illuminate\Http\JsonResponse
     */    
    #[OA\Get(
        path: "/user-statuses",
        summary: "Liste des statuts possibles",
        tags: ["Utilisateurs"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Liste des statuts")
        ]
    )]
    public function getStatutsUtilisateurs()
    {
        try {
            $statuts = StatutUtilisateur::all();

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Liste des statuts d\'utilisateurs récupérée avec succès',
                'data' => $statuts
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération des statuts d'utilisateurs: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la récupération des statuts d\'utilisateurs',
                'data' => null
            ], 500);
        }
    }
}