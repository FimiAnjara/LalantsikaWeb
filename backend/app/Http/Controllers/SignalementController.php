<?php

namespace App\Http\Controllers;

use App\Models\Signalement;
use App\Models\Statut;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SignalementController extends Controller
{
    /**
     * Liste tous les signalements avec leurs relations
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $signalements = Signalement::with(['utilisateur', 'statut', 'entreprise'])
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

                    return [
                        'id_signalement' => $signalement->id_signalement,
                        'daty' => $signalement->daty ? $signalement->daty->format('Y-m-d H:i') : null,
                        'surface' => (float) $signalement->surface,
                        'budget' => (float) $signalement->budget,
                        'description' => $signalement->description,
                        'photo' => $signalement->photo,
                        'statut' => $signalement->statut ? $signalement->statut->libelle : null,
                        'id_statut' => $signalement->id_statut,
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
                'message' => 'Liste des signalements récupérée avec succès',
                'data' => $signalements
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération des signalements: " . $e->getMessage());
            
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
     * Récupère un signalement par son ID
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $signalement = Signalement::with(['utilisateur', 'statut', 'entreprise'])
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
                    'statut' => $signalement->statut,
                    'id_statut' => $signalement->id_statut,
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
     * Met à jour le statut d'un signalement
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatut(Request $request, $id)
    {
        try {
            $request->validate([
                'id_statut' => 'required|exists:statut,id_statut'
            ]);

            $signalement = Signalement::findOrFail($id);
            $signalement->id_statut = $request->id_statut;
            $signalement->save();

            $statut = Statut::find($request->id_statut);

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Statut du signalement mis à jour avec succès',
                'data' => [
                    'id_signalement' => $signalement->id_signalement,
                    'statut' => $statut ? $statut->libelle : null,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur lors de la mise à jour du statut: " . $e->getMessage());
            
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du statut',
                'data' => null
            ], 500);
        }
    }

    /**
     * Supprime un signalement
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
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
