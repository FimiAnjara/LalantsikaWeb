<?php

namespace App\Http\Controllers;

use App\Models\Tarif;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Tarifs",
    description: "Gestion des tarifs"
)]
class TarifController extends Controller
{
    /**
     * Récupère le tarif actuel (le plus récent)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/tarifs/current",
        summary: "Récupérer le tarif actuel",
        tags: ["Tarifs"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Tarif récupéré avec succès"),
            new OA\Response(response: 404, description: "Aucun tarif trouvé")
        ]
    )]
    public function current()
    {
        try {
            $tarif = Tarif::orderBy('date_', 'desc')->first();

            if (!$tarif) {
                return response()->json([
                    'code' => 404,
                    'success' => false,
                    'message' => 'Aucun tarif configuré',
                    'data' => null
                ], 404);
            }

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Tarif récupéré avec succès',
                'data' => [
                    'id_prix' => $tarif->id_prix,
                    'montant' => (float) $tarif->montant,
                    'date_' => $tarif->date_,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération du tarif: " . $e->getMessage());
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la récupération du tarif',
                'data' => null
            ], 500);
        }
    }

    /**
     * Liste tous les tarifs
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/tarifs",
        summary: "Liste tous les tarifs",
        tags: ["Tarifs"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Liste des tarifs")
        ]
    )]
    public function index()
    {
        try {
            $tarifs = Tarif::orderBy('date_', 'desc')->get();

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Liste des tarifs récupérée avec succès',
                'data' => $tarifs
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération des tarifs: " . $e->getMessage());
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la récupération des tarifs',
                'data' => null
            ], 500);
        }
    }

    /**
     * Créer un nouveau tarif
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/tarifs",
        summary: "Créer un nouveau tarif",
        tags: ["Tarifs"],
        security: [["bearerAuth" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["montant"],
                properties: [
                    new OA\Property(property: "montant", type: "number", description: "Montant du tarif par m²")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Tarif créé avec succès"),
            new OA\Response(response: 422, description: "Erreur de validation")
        ]
    )]
    public function store(Request $request)
    {
        try {
            $request->validate([
                'montant' => 'required|numeric|min:0',
            ]);

            $tarif = new Tarif();
            $tarif->montant = $request->montant;
            $tarif->date_ = now();
            $tarif->save();

            return response()->json([
                'code' => 201,
                'success' => true,
                'message' => 'Tarif créé avec succès',
                'data' => [
                    'id_prix' => $tarif->id_prix,
                    'montant' => (float) $tarif->montant,
                    'date_' => $tarif->date_,
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'code' => 422,
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
                'data' => null
            ], 422);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la création du tarif: " . $e->getMessage());
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la création du tarif',
                'data' => null
            ], 500);
        }
    }
}
