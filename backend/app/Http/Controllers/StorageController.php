<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StorageController extends Controller
{
    /**
     * Servir un fichier depuis le disque public
     * 
     * @param string $path - Chemin du fichier (ex: utilisateur/photo.png)
     * @return StreamedResponse|void
     */
    public function serve($path)
    {
        try {
            Log::info("Serving file: {$path}");
            
            // Valider que le fichier existe sur le disque public
            if (!Storage::disk('public')->exists($path)) {
                Log::warning("File not found: {$path}");
                return response()->json(['error' => 'Fichier non trouvé'], 404);
            }

            // Récupérer le fichier
            $file = Storage::disk('public')->get($path);
            
            // Déterminer le type MIME
            $mimeType = Storage::disk('public')->mimeType($path);
            
            Log::info("File served successfully: {$path}");
            
            // Retourner le fichier
            return response($file)
                ->header('Content-Type', $mimeType)
                ->header('Cache-Control', 'public, max-age=3600')
                ->header('Content-Disposition', 'inline');
                
        } catch (\Exception $e) {
            Log::error('Serve file error: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Uploader un fichier utilisateur
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadUserPhoto(Request $request)
    {
        Log::info('===== UPLOAD PHOTO REQUEST =====', [
            'method' => $request->method(),
            'path' => $request->path(),
            'has_file_photo' => $request->hasFile('photo'),
            'all_files' => array_keys($request->allFiles()),
            'all_inputs' => array_keys($request->all()),
            'has_auth' => !!$request->header('Authorization'),
            'auth_user' => auth('api')->user()?->id_utilisateur ?? 'NO_USER',
        ]);

        try {
            Log::info('Validating photo field');
            $request->validate([
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB
            ]);

            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                
                Log::info('File validated', [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'valid' => $file->isValid(),
                ]);
                
                // Vérifier que le fichier est valide
                if (!$file->isValid()) {
                    Log::error('Invalid file upload');
                    return response()->json(['error' => 'Le fichier uploadé n\'est pas valide'], 400);
                }

                $filename = 'utilisateur_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                
                Log::info('Storing file', ['filename' => $filename]);
                
                // Stocker sur le disque public
                $path = Storage::disk('public')->putFileAs('utilisateur', $file, $filename);
                
                if (!$path) {
                    Log::error('Failed to store file');
                    return response()->json(['error' => 'Erreur lors du stockage du fichier'], 500);
                }
                
                Log::info('File stored successfully', ['path' => $path]);
                
                return response()->json([
                    'success' => true,
                    'path' => '/api/storage/utilisateur/' . basename($path),
                    'url' => url('/api/storage/utilisateur/' . basename($path)),
                ]);
            }

            Log::warning('No file in upload request');
            return response()->json(['error' => 'Aucun fichier fourni'], 400);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error:', $e->errors());
            return response()->json([
                'error' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Upload photo error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Erreur serveur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Supprimer un fichier utilisateur
     * 
     * @param string $filename
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteUserPhoto($filename)
    {
        try {
            $path = 'utilisateur/' . $filename;
            
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                return response()->json(['success' => true]);
            }

            return response()->json(['error' => 'Fichier non trouvé'], 404);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
