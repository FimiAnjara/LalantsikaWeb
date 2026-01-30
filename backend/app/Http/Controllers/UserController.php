<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\StatutUtilisateur;
use App\Models\TypeUtilisateur;
use App\Models\Sexe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Liste tous les utilisateurs avec leur statut
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $users = User::with(['sexe', 'typeUtilisateur', 'statuts' => function($query) {
                $query->orderBy('date_', 'desc')->limit(1);
            }])
            ->orderBy('id_utilisateur', 'desc')
            ->get()
            ->map(function ($user) {
                // Récupérer le dernier statut
                $dernierStatut = $user->statuts->first();
                
                return [
                    'id_utilisateur' => $user->id_utilisateur,
                    'identifiant' => $user->identifiant,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'email' => $user->email,
                    'dtn' => $user->dtn ? $user->dtn->format('Y-m-d') : null,
                    'sexe' => $user->sexe ? $user->sexe->libelle : null,
                    'type_utilisateur' => $user->typeUtilisateur ? $user->typeUtilisateur->libelle : null,
                    'synchronized' => $user->synchronized ?? false,
                    'statut' => $dernierStatut ? ($dernierStatut->etat == 1 ? 'actif' : 'bloque') : 'actif',
                ];
            });

            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Liste des utilisateurs récupérée avec succès',
                'data' => $users
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
            ]);

            // Mettre à jour les champs
            if (isset($validated['nom'])) $user->nom = $validated['nom'];
            if (isset($validated['prenom'])) $user->prenom = $validated['prenom'];
            if (isset($validated['email'])) $user->email = $validated['email'];
            if (isset($validated['dtn'])) $user->dtn = $validated['dtn'];
            if (isset($validated['id_sexe'])) $user->id_sexe = $validated['id_sexe'];
            if (isset($validated['id_type_utilisateur'])) $user->id_type_utilisateur = $validated['id_type_utilisateur'];

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
}
