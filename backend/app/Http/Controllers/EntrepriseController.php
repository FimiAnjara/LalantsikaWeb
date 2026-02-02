<?php

namespace App\Http\Controllers;

use App\Models\Entreprise;
use App\Services\Sync\DatabaseSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Entreprises",
    description: "Gestion des entreprises"
)]
class EntrepriseController extends Controller
{
    protected $syncService;

    public function __construct(DatabaseSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Liste toutes les entreprises
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/entreprises",
        summary: "Liste toutes les entreprises",
        tags: ["Entreprises"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Liste des entreprises récupérée avec succès"),
            new OA\Response(response: 401, description: "Non authentifié")
        ]
    )]
    public function index()
    {
        $entreprises = Entreprise::all();
        return response()->json([
            'data' => $entreprises,
            'success' => true,
            'message' => 'Entreprises retrieved successfully',
            'code' => 200
        ]);
    }

    /**
     * Créer une entreprise (PostgreSQL + Firebase)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/entreprises",
        summary: "Créer une nouvelle entreprise",
        tags: ["Entreprises"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            description: "Données de l'entreprise",
            required: true,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    required: ["nom_entreprise", "id_utilisateur"],
                    properties: [
                        new OA\Property(property: "nom_entreprise", type: "string", maxLength: 255, example: "Entreprise ABC"),
                        new OA\Property(property: "adresse", type: "string", nullable: true, example: "123 rue de la Paix"),
                        new OA\Property(property: "tel", type: "string", maxLength: 20, nullable: true, example: "+261341234567"),
                        new OA\Property(property: "id_utilisateur", type: "integer", example: 1)
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Entreprise créée avec succès"),
            new OA\Response(response: 401, description: "Non authentifié"),
            new OA\Response(response: 422, description: "Erreur de validation")
        ]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_entreprise' => 'required|string|max:255',
            'adresse' => 'nullable|string',
            'tel' => 'nullable|string|max:20',
            'id_utilisateur' => 'required|exists:utilisateur,id_utilisateur'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Utiliser le service universel de sync
        $entreprise = $this->syncService->create(
            new Entreprise(),
            'entreprises', // Nom collection Firebase
            $validator->validated()
        );

        return response()->json([
            'message' => 'Entreprise créée avec succès',
            'entreprise' => $entreprise,
            'synchronized' => $entreprise->synchronized
        ], 201);
    }

    /**
     * Mettre à jour une entreprise
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Put(
        path: "/entreprises/{id}",
        summary: "Mettre à jour une entreprise",
        tags: ["Entreprises"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            description: "Données à mettre à jour",
            required: false,
            content: new OA\MediaType(
                mediaType: "application/json",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "nom_entreprise", type: "string", maxLength: 255, example: "Nouveau nom"),
                        new OA\Property(property: "adresse", type: "string", nullable: true, example: "Nouvelle adresse"),
                        new OA\Property(property: "tel", type: "string", maxLength: 20, nullable: true, example: "+261341234567")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Entreprise mise à jour avec succès"),
            new OA\Response(response: 401, description: "Non authentifié"),
            new OA\Response(response: 404, description: "Entreprise non trouvée"),
            new OA\Response(response: 422, description: "Erreur de validation")
        ]
    )]
    public function update(Request $request, $id)
    {
        $entreprise = Entreprise::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom_entreprise' => 'sometimes|string|max:255',
            'adresse' => 'nullable|string',
            'tel' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $this->syncService->update(
            $entreprise,
            'entreprises',
            $validator->validated()
        );

        return response()->json([
            'message' => 'Entreprise mise à jour',
            'entreprise' => $entreprise->fresh(),
            'synchronized' => $entreprise->fresh()->synchronized
        ]);
    }

    /**
     * Supprimer une entreprise
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Delete(
        path: "/entreprises/{id}",
        summary: "Supprimer une entreprise",
        tags: ["Entreprises"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Entreprise supprimée avec succès"),
            new OA\Response(response: 401, description: "Non authentifié"),
            new OA\Response(response: 404, description: "Entreprise non trouvée")
        ]
    )]
    public function destroy($id)
    {
        $entreprise = Entreprise::findOrFail($id);
        
        $this->syncService->delete($entreprise, 'entreprises');

        return response()->json([
            'message' => 'Entreprise supprimée'
        ]);
    }
}
