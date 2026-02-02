<?php

namespace App\Http\Controllers;

use App\Models\Signalement;
use App\Models\Statut;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\HistoStatut;

use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Signalements",
    description: "Gestion des signalements, leur état et leur historique"
)]
class SignalementController extends Controller
{
    /**
     * Liste tous les signalements avec leurs relations
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/reports",
        summary: "Liste tous les signalements",
        tags: ["Signalements"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Liste récupérée avec succès"),
            new OA\Response(response: 401, description: "Non authentifié")
        ]
    )]
    public function index()
    {
        try {

            $signalements = Signalement::with(['utilisateur', 'entreprise'])
                ->orderBy('id_signalement', 'desc')
                ->get()
                ->map(function ($signalement) {
                    // Extraire latitude/longitude du champ geometry
                    $coordinates = null;
                    if ($signalement->point) {
                        $lat = null;
                        $lng = null;
                        try {
                            $lat = DB::selectOne('SELECT ST_Y(point) as lat FROM signalement WHERE id_signalement = ?', [$signalement->id_signalement])->lat ?? null;
                            $lng = DB::selectOne('SELECT ST_X(point) as lng FROM signalement WHERE id_signalement = ?', [$signalement->id_signalement])->lng ?? null;
                        } catch (\Exception $e) {}
                        if ($lat !== null && $lng !== null) {
                            $coordinates = [
                                'latitude' => $lat,
                                'longitude' => $lng,
                            ];
                        }
                    }

                    // Récupérer le dernier statut depuis histo_statut
                    $lastHisto = HistoStatut::where('id_signalement', $signalement->id_signalement)
                        ->orderByDesc('daty')
                        ->first();
                    $statut = null;
                    if ($lastHisto) {
                        $statutObj = $lastHisto->statut;
                        $statut = $statutObj ? $statutObj->libelle : null;
                    }

                    return [
                        'id_signalement' => $signalement->id_signalement,
                        'daty' => $signalement->daty ? $signalement->daty->format('Y-m-d H:i') : null,
                        'surface' => (float) $signalement->surface,
                        'budget' => (float) $signalement->budget,
                        'description' => $signalement->description,
                        'photo' => $signalement->photo,
                        'statut' => $statut,
                        'utilisateur' => $signalement->utilisateur ? [
                            'id' => $signalement->utilisateur->id_utilisateur,
                            'nom' => $signalement->utilisateur->nom,
                            'prenom' => $signalement->utilisateur->prenom,
                            'nom_complet' => $signalement->utilisateur->prenom . ' ' . $signalement->utilisateur->nom,
                        ] : null,
                        'entreprise' => $signalement->entreprise ? [
                            'id' => $signalement->entreprise->id_entreprise,
                            'nom' => $signalement->entreprise->nom,
                        ] : null,
                        'coordinates' => $coordinates,
                        'latitude' => $coordinates ? $coordinates['latitude'] : null,
                        'longitude' => $coordinates ? $coordinates['longitude'] : null,
                        'synchronized' => $signalement->synchronized ?? false,
                    ];
                });

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Signalements récupérés avec succès',
                'data' => $signalements
            ]);

        } catch (\Exception $e) {
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la récupération des signalements',
                'error' => $e->getMessage(),
                'data' => null
            ]);
        }
    }



        /**
     * Met à jour un signalement (budget, entreprise, etc.)
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Put(
        path: "/reports/{id}",
        summary: "Mettre à jour un signalement (budget, entreprise)",
        tags: ["Signalements"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "id_entreprise", type: "integer"),
                    new OA\Property(property: "budget", type: "number")
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Mise à jour réussie"),
            new OA\Response(response: 404, description: "Signalement non trouvé")
        ]
    )]
    public function update(Request $request, $id)
    {
        try {
            $signalement = Signalement::findOrFail($id);

            $data = $request->only(['id_entreprise', 'budget']);
            $updated = false;

            if (isset($data['id_entreprise'])) {
                $signalement->id_entreprise = $data['id_entreprise'];
                $updated = true;
            }
            if (isset($data['budget'])) {
                $signalement->budget = $data['budget'];
                $updated = true;
            }

            if ($updated) {
                $signalement->save();
            }

            // Charger les relations pour la réponse
            $signalement->load(['utilisateur', 'statut', 'entreprise']);

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Signalement mis à jour avec succès',
                'data' => $signalement
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la mise à jour du signalement: " . $e->getMessage());
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du signalement',
                'error' => $e->getMessage(),
                'data' => null
            ], 500);
        }
    }

    /**
     * Récupère un signalement par son ID
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/reports/{id}",
        summary: "Détails d'un signalement",
        tags: ["Signalements"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Détails récupérés avec succès"),
            new OA\Response(response: 404, description: "Signalement non trouvé")
        ]
    )]
    public function show($id)
    {
        try {

            $signalement = Signalement::with(['utilisateur', 'entreprise'])
                ->findOrFail($id);

            // Récupérer les coordonnées du point (depuis la colonne point de signalement)
            $coordinates = null;
            if ($signalement->point) {
                $lat = null;
                $lng = null;
                try {
                    $lat = DB::selectOne('SELECT ST_Y(point) as lat FROM signalement WHERE id_signalement = ?', [$signalement->id_signalement])->lat ?? null;
                    $lng = DB::selectOne('SELECT ST_X(point) as lng FROM signalement WHERE id_signalement = ?', [$signalement->id_signalement])->lng ?? null;
                } catch (\Exception $e) {}
                if ($lat !== null && $lng !== null) {
                    $coordinates = [
                        'latitude' => $lat,
                        'longitude' => $lng,
                    ];
                }
            }

            // Récupérer le dernier statut depuis histo_statut (modèle)
            $lastHisto = HistoStatut::where('id_signalement', $signalement->id_signalement)
                ->orderByDesc('daty')
                ->first();
            $statut = null;
            if ($lastHisto) {
                $statutObj = $lastHisto->statut;
                $statut = $statutObj ? $statutObj->libelle : null;
            }

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Signalement récupéré avec succès',
                'data' => [
                    'id_signalement' => $signalement->id_signalement,
                    'daty' => $signalement->daty ? $signalement->daty->format('Y-m-d H:i') : null,
                    'surface' => (float) $signalement->surface,
                    'budget' => (float) $signalement->budget,
                    'description' => $signalement->description,
                    'photo' => $signalement->photo,
                    'statut' => $statut,
                    'utilisateur' => $signalement->utilisateur,
                    'entreprise' => $signalement->entreprise,
                    'coordinates' => $coordinates,
                    'synchronized' => $signalement->synchronized ?? false,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération du signalement: " . $e->getMessage());
            
            return response()->json([
                'code' => 404,
                'success' => false,
                'message' => 'Signalement non trouvé',
                'data' => null
            ]);
        }
    }

       /**
     * Ajoute un historique de statut (histostatut) pour un signalement
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Post(
        path: "/reports/{id}/histostatut",
        summary: "Ajouter une étape d'historique (changement de statut)",
        tags: ["Signalements"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["id_statut", "description", "daty"],
                    properties: [
                        new OA\Property(property: "id_statut", type: "integer"),
                        new OA\Property(property: "description", type: "string"),
                        new OA\Property(property: "daty", type: "string", format: "date"),
                        new OA\Property(property: "photo", type: "string", format: "binary")
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Historique ajouté avec succès"),
            new OA\Response(response: 404, description: "Signalement non trouvé")
        ]
    )]
    public function addHistoStatut(Request $request, $id)
    {
        try {
            $request->validate([
                'id_statut' => 'required|exists:statut,id_statut',
                'description' => 'required|string',
                'daty' => 'required|date',
            ]);

            $signalement = Signalement::findOrFail($id);

            // Gestion de l'image (optionnelle)
            $photoPath = null;
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('histostatut', 'public');
            }

            // Insertion via modèle HistoStatut
            $histo = new HistoStatut();
            $histo->id_signalement = $signalement->id_signalement;
            $histo->id_statut = $request->id_statut;
            $histo->description = $request->description;
            $histo->daty = $request->daty;
            $histo->image = $photoPath;
            $histo->save();

            return response()->json([
                'code' => 201,
                'success' => true,
                'message' => 'Historique de statut ajouté avec succès',
                'data' => [
                    'id_histo_statut' => $histo->id_histo_statut,
                    'id_signalement' => $histo->id_signalement,
                    'id_statut' => $histo->id_statut,
                    'description' => $histo->description,
                    'daty' => $histo->daty,
                    'image' => $histo->image,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error("Erreur lors de l'ajout de l'historique de statut: " . $e->getMessage());
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de l\'ajout de l\'historique de statut',
                'error' => $e->getMessage(),
                'data' => null
            ]);
        }
    }

      /**
     * Récupère l'historique des statuts d'un signalement
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/reports/{id}/histostatut",
        summary: "Récupérer l'historique des statuts",
        tags: ["Signalements"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Historique récupéré")
        ]
    )]
    public function getHistoStatuts($id)
    {
        try {
            $histos = HistoStatut::with('statut')
                ->where('id_signalement', $id)
                ->orderBy('daty', 'desc')
                ->get();

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Historique des statuts récupéré avec succès',
                'data' => $histos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique',
                'error' => $e->getMessage(),
                'data' => null
            ]);
        }
    }


    // La mise à jour du statut du signalement n'est plus nécessaire : le statut courant est le dernier de l'historique

    /**
     * Supprime un signalement
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Delete(
        path: "/reports/{id}",
        summary: "Supprimer un signalement",
        tags: ["Signalements"],
        security: [["bearerAuth" => []]],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Signalement supprimé"),
            new OA\Response(response: 404, description: "Signalement non trouvé")
        ]
    )]
    public function destroy($id)
    {
        try {
            $signalement = Signalement::findOrFail($id);
            $signalement->delete();

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Signalement supprimé avec succès',
                'data' => null
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la suppression du signalement: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la suppression du signalement',
                'data' => null
            ], 500);
        }
    }

    /**
     * Liste tous les statuts disponibles
     *
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/statuses",
        summary: "Liste des statuts de signalement possibles",
        tags: ["Signalements"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Liste des statuts")
        ]
    )]
    public function getStatuts()
    {
        try {
            $statuts = Statut::all();

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Liste des statuts récupérée avec succès',
                'data' => $statuts
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération des statuts: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la récupération des statuts',
                'data' => null
            ], 500);
        }
    }
}
