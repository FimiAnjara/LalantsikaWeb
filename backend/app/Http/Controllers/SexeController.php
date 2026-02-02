<?php

namespace App\Http\Controllers;

use App\Models\Sexe;
use Illuminate\Container\Attributes\Log;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Sexes",
    description: "Gestion des types de sexe"
)]
class SexeController extends Controller
{
    /**
     * Get all sexes
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/sexes",
        summary: "Liste de tous les sexes",
        tags: ["Sexes"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Liste des sexes récupérée avec succès"),
            new OA\Response(response: 401, description: "Non authentifié"),
            new OA\Response(response: 500, description: "Erreur serveur")
        ]
    )]
    public function index()
    {
        try {
            $sexes = Sexe::all();
            
            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Sexes retrieved successfully',
                'data' => $sexes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Failed to retrieve sexes',
                'data' => ['error' => $e->getMessage()]
            ], 500);
        }
    }
}
