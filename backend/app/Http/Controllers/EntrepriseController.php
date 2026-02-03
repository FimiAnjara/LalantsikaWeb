<?php

namespace App\Http\Controllers;

use App\Models\Entreprise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class EntrepriseController extends Controller
{
    /**
     * Liste toutes les entreprises depuis PostgreSQL
     */
    public function index()
    {
        try {
            $entreprises = Entreprise::all();
            return response()->json([
                'data' => $entreprises,
                'success' => true,
                'message' => 'Entreprises récupérées avec succès',
                'code' => 200
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la récupération des entreprises: " . $e->getMessage());
            return response()->json([
                'data' => [],
                'success' => false,
                'message' => 'Erreur lors de la récupération des entreprises',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    /**
     * Créer une entreprise dans PostgreSQL
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_entreprise' => 'required|string|max:255',
            'adresse' => 'nullable|string',
            'tel' => 'nullable|string|max:20',
            'id_utilisateur' => 'nullable|exists:utilisateur,id_utilisateur',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'code' => 422
            ], 422);
        }

        try {
            $entreprise = Entreprise::create($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Entreprise créée avec succès',
                'data' => $entreprise,
                'code' => 201
            ], 201);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la création de l'entreprise: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    /**
     * Afficher une entreprise
     */
    public function show($id)
    {
        try {
            $entreprise = Entreprise::findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $entreprise,
                'code' => 200
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Entreprise non trouvée',
                'code' => 404
            ], 404);
        }
    }

    /**
     * Mettre à jour une entreprise
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nom_entreprise' => 'sometimes|string|max:255',
            'adresse' => 'nullable|string',
            'tel' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'code' => 422
            ], 422);
        }

        try {
            $entreprise = Entreprise::findOrFail($id);
            $entreprise->update($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Entreprise mise à jour',
                'data' => $entreprise->fresh(),
                'code' => 200
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la mise à jour de l'entreprise: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    /**
     * Supprimer une entreprise
     */
    public function destroy($id)
    {
        try {
            $entreprise = Entreprise::findOrFail($id);
            $entreprise->delete();

            return response()->json([
                'success' => true,
                'message' => 'Entreprise supprimée',
                'code' => 200
            ]);
        } catch (\Exception $e) {
            Log::error("Erreur lors de la suppression de l'entreprise: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
