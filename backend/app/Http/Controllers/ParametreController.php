<?php

namespace App\Http\Controllers;

use App\Models\Parametre;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ParametreController extends Controller
{
    /**
     * Récupérer les paramètres
     */
    public function index(): JsonResponse
    {
        try {
            $parametre = Parametre::first();
            
            if (!$parametre) {
                // Si aucun paramètre n'existe, retourner les valeurs par défaut
                return response()->json([
                    'success' => true,
                    'data' => [
                        'tentative_max' => 3,
                        'synchronized' => false,
                        'last_sync_at' => null
                    ]
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => $parametre
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des paramètres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer ou mettre à jour les paramètres
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'tentative_max' => 'required|integer|min:1|max:10',
            ], [
                'tentative_max.required' => 'Le nombre de tentatives maximum est requis',
                'tentative_max.integer' => 'Le nombre de tentatives maximum doit être un nombre entier',
                'tentative_max.min' => 'Le nombre de tentatives maximum doit être au moins 1',
                'tentative_max.max' => 'Le nombre de tentatives maximum ne peut pas dépasser 10',
            ]);

            $parametre = Parametre::first();
            
            if ($parametre) {
                // Mise à jour
                $parametre->update([
                    'tentative_max' => $request->tentative_max,
                    'synchronized' => false,
                    'last_sync_at' => now()
                ]);
            } else {
                // Création
                $parametre = Parametre::create([
                    'tentative_max' => $request->tentative_max,
                    'synchronized' => false,
                    'last_sync_at' => now()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Paramètres sauvegardés avec succès',
                'data' => $parametre
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la sauvegarde des paramètres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser les paramètres
     */
    public function sync(): JsonResponse
    {
        try {
            $parametre = Parametre::first();
            
            if (!$parametre) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun paramètre à synchroniser'
                ], 404);
            }

            $parametre->update([
                'synchronized' => true,
                'last_sync_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Synchronisation réussie',
                'data' => $parametre
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}