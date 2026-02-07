<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Routes de debug et test - À retirer en production
 */

Route::middleware('auth:api')->group(function () {
    // Test si l'authentification JWT fonctionne
    Route::get('/debug/auth', function (Request $request) {
        return response()->json([
            'authenticated' => true,
            'user' => auth('api')->user(),
            'token_header' => $request->header('Authorization'),
        ]);
    });

    // Test d'upload de fichier basique
    Route::post('/debug/upload', function (Request $request) {
        $request->validate(['file' => 'required|file|max:5120']);
        
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            \Log::info('Debug upload', [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'valid' => $file->isValid(),
                'mime' => $file->getMimeType(),
            ]);
            
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = Storage::disk('public')->putFileAs('test', $file, $filename);
            
            return response()->json([
                'success' => !!$path,
                'path' => $path,
                'filename' => $filename,
                'storage_path' => Storage::disk('public')->path($path ?? ''),
            ]);
        }
        
        return response()->json(['error' => 'No file'], 400);
    });

    // Vérifier les permissions du répertoire
    Route::get('/debug/storage-check', function () {
        $publicPath = Storage::disk('public')->path('');
        $utilisateurPath = Storage::disk('public')->path('utilisateur');
        
        return response()->json([
            'public_path' => $publicPath,
            'utilisateur_path' => $utilisateurPath,
            'public_exists' => is_dir($publicPath),
            'utilisateur_exists' => is_dir($utilisateurPath),
            'public_writable' => is_writable($publicPath),
            'utilisateur_writable' => is_writable($utilisateurPath),
        ]);
    });
});
