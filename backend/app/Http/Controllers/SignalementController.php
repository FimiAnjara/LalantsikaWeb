<?php

namespace App\Http\Controllers;

use App\Models\Signalement;
use App\Models\Statut;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\HistoStatut;

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
            $signalements = Signalement::with(['utilisateur', 'entreprise'])
                ->select(
                    'id_signalement',
                    'daty',
                    'surface',
                    'budget',
                    'description',
                    'photo',
                    'id_entreprise',
                    'id_utilisateur',
                    DB::raw('ST_Y(point::geometry) as latitude'),
                    DB::raw('ST_X(point::geometry) as longitude'),
                    'synchronized'
                )
                ->orderBy('id_signalement', 'desc')
                ->get()
                ->map(function ($signalement) {
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
                        'latitude' => $signalement->latitude ? (float) $signalement->latitude : null,
                        'longitude' => $signalement->longitude ? (float) $signalement->longitude : null,
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
    public function show($id)
    {
        try {

            $signalement = Signalement::with(['utilisateur', 'entreprise'])
                ->select(
                    'id_signalement',
                    'daty',
                    'surface',
                    'budget',
                    'description',
                    'photo',
                    'id_entreprise',
                    'id_utilisateur',
                    DB::raw('ST_Y(point::geometry) as latitude'),
                    DB::raw('ST_X(point::geometry) as longitude'),
                    'synchronized'
                )
                ->findOrFail($id);

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
                    'latitude' => $signalement->latitude ? (float) $signalement->latitude : null,
                    'longitude' => $signalement->longitude ? (float) $signalement->longitude : null,
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
