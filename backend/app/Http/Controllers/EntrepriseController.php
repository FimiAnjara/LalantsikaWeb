<?php

namespace App\Http\Controllers;

use App\Models\Entreprise;
use App\Services\DatabaseSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EntrepriseController extends Controller
{
    protected $syncService;

    public function __construct(DatabaseSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Créer une entreprise (PostgreSQL + Firebase)
     */
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
     */
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
     */
    public function destroy($id)
    {
        $entreprise = Entreprise::findOrFail($id);
        
        $this->syncService->delete($entreprise, 'entreprises');

        return response()->json([
            'message' => 'Entreprise supprimée'
        ]);
    }
}
