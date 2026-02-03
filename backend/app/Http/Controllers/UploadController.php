<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Services\Firebase\StorageService;

/**
 * @OA\Tag(
 *     name="Upload",
 *     description="API pour l'upload d'images vers Firebase Storage"
 * )
 */
class UploadController extends Controller
{
    protected $storageService;

    public function __construct(StorageService $storageService)
    {
        $this->storageService = $storageService;
    }

    /**
     * @OA\Post(
     *     path="/api/upload/image",
     *     tags={"Upload"},
     *     summary="Upload une image vers Firebase Storage",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(property="image", type="string", format="binary"),
     *                 @OA\Property(property="folder", type="string", default="uploads"),
     *                 @OA\Property(property="filename", type="string")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Image uploadée avec succès"),
     *     @OA\Response(response=400, description="Erreur de validation"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function uploadImage(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required',
                'folder' => 'nullable|string',
            ]);

            $folder = $request->input('folder', 'uploads');
            $timestamp = time();
            $randomId = Str::random(6);
            $filename = $request->input('filename') ?: "{$timestamp}_{$randomId}";

            // Traiter l'image - peut être un fichier ou du base64
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $extension = $file->getClientOriginalExtension() ?: 'jpg';
                $fullFilename = "{$filename}.{$extension}";
                $contentType = $file->getMimeType();
                $imageData = file_get_contents($file->getRealPath());

                $result = $this->storageService->uploadFile($imageData, $folder, $fullFilename, $contentType);
            } else {
                // Base64 data
                $base64Data = $request->input('image');
                $result = $this->storageService->uploadBase64($base64Data, $folder, $filename);
            }

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'upload vers Firebase Storage',
                    'error' => $result['error'] ?? 'Erreur inconnue'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Image uploadée avec succès',
                'data' => [
                    'url' => $result['url'],
                    'path' => $result['path'],
                    'name' => $result['name'],
                    'contentType' => $result['contentType']
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     *     path="/api/upload/base64",
     *     tags={"Upload"},
     *     summary="Upload une image en base64 vers Firebase Storage",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="image", type="string", description="Image en base64"),
     *             @OA\Property(property="folder", type="string", default="uploads"),
     *             @OA\Property(property="filename", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Image uploadée avec succès"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function uploadBase64(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required|string',
                'folder' => 'nullable|string',
                'filename' => 'nullable|string',
            ]);

            $base64Data = $request->input('image');
            $folder = $request->input('folder', 'uploads');
            $filename = $request->input('filename');

            $result = $this->storageService->uploadBase64($base64Data, $folder, $filename);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'upload vers Firebase Storage',
                    'error' => $result['error'] ?? 'Erreur inconnue'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Image uploadée avec succès',
                'data' => [
                    'url' => $result['url'],
                    'path' => $result['path'],
                    'name' => $result['name'],
                    'contentType' => $result['contentType']
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Delete(
     *     path="/api/upload/delete",
     *     tags={"Upload"},
     *     summary="Supprimer une image de Firebase Storage",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="path", type="string", description="Chemin du fichier à supprimer")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Image supprimée avec succès"),
     *     @OA\Response(response=500, description="Erreur serveur")
     * )
     */
    public function deleteImage(Request $request)
    {
        try {
            $request->validate([
                'path' => 'required|string',
            ]);

            $path = $request->input('path');
            $result = $this->storageService->deleteFile($path);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la suppression',
                    'error' => $result['error'] ?? 'Erreur inconnue'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Image supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
