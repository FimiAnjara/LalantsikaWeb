<?php

namespace App\Http\Controllers;

use App\Services\Notification\FcmService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Notifications",
    description: "Gestion des notifications push"
)]
class NotificationController extends Controller
{
    protected $fcmService;

    public function __construct(FcmService $fcmService)
    {
        $this->fcmService = $fcmService;
    }

    /**
     * Envoyer une notification à un utilisateur
     */
    #[OA\Post(
        path: "/notifications/send",
        summary: "Envoyer une notification push à un utilisateur",
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["id_utilisateur", "title", "body"],
                properties: [
                    new OA\Property(property: "id_utilisateur", type: "integer", example: 1, description: "ID de l'utilisateur"),
                    new OA\Property(property: "title", type: "string", example: "Nouveau message", description: "Titre de la notification"),
                    new OA\Property(property: "body", type: "string", example: "Vous avez reçu un nouveau message", description: "Corps de la notification"),
                    new OA\Property(property: "data", type: "object", example: ["type" => "message", "id" => "123"], description: "Données supplémentaires")
                ]
            )
        ),
        tags: ["Notifications"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Notification envoyée avec succès",
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: "success", type: "boolean", example: true),
                    new OA\Property(property: "message", type: "string", example: "Notification sent successfully")
                ])
            ),
            new OA\Response(response: 400, description: "Données invalides"),
            new OA\Response(response: 500, description: "Erreur serveur")
        ]
    )]
    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_utilisateur' => 'required|integer',
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:1000',
            'data' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $result = $this->fcmService->sendToUser(
                $request->input('id_utilisateur'),
                $request->input('title'),
                $request->input('body'),
                $request->input('data', [])
            );

            if ($result['success']) {
                return response()->json($result, 200);
            } else {
                return response()->json($result, 400);
            }
        } catch (\Exception $e) {
            Log::error('Erreur envoi notification: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'envoi de la notification'
            ], 500);
        }
    }

    /**
     * Envoyer une notification à plusieurs utilisateurs
     */
    #[OA\Post(
        path: "/notifications/send-multiple",
        summary: "Envoyer une notification push à plusieurs utilisateurs",
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["id_utilisateurs", "title", "body"],
                properties: [
                    new OA\Property(
                        property: "id_utilisateurs",
                        type: "array",
                        items: new OA\Items(type: "integer"),
                        example: [1, 2, 3]
                    ),
                    new OA\Property(property: "title", type: "string", example: "Annonce"),
                    new OA\Property(property: "body", type: "string", example: "Nouvelle mise à jour disponible"),
                    new OA\Property(property: "data", type: "object", example: ["type" => "announcement"])
                ]
            )
        ),
        tags: ["Notifications"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Résultat de l'envoi",
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: "total", type: "integer", example: 3),
                    new OA\Property(property: "success", type: "integer", example: 2),
                    new OA\Property(property: "failed", type: "integer", example: 1)
                ])
            )
        ]
    )]
    public function sendMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_utilisateurs' => 'required|array|min:1',
            'id_utilisateurs.*' => 'integer',
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:1000',
            'data' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $result = $this->fcmService->sendToMultipleUsers(
                $request->input('id_utilisateurs'),
                $request->input('title'),
                $request->input('body'),
                $request->input('data', [])
            );

            return response()->json($result, 200);
        } catch (\Exception $e) {
            Log::error('Erreur envoi notifications multiples: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'envoi des notifications'
            ], 500);
        }
    }

    /**
     * Envoyer une notification directement à un token FCM (pour test)
     */
    #[OA\Post(
        path: "/notifications/send-to-token",
        summary: "Envoyer une notification directement à un token FCM",
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["token", "title", "body"],
                properties: [
                    new OA\Property(property: "token", type: "string", example: "fcm_token_here", description: "Token FCM du device"),
                    new OA\Property(property: "title", type: "string", example: "Test"),
                    new OA\Property(property: "body", type: "string", example: "Ceci est un test"),
                    new OA\Property(property: "data", type: "object", example: ["test" => "true"])
                ]
            )
        ),
        tags: ["Notifications"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Notification envoyée")
        ]
    )]
    public function sendToToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:1000',
            'data' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $result = $this->fcmService->sendToToken(
                $request->input('token'),
                $request->input('title'),
                $request->input('body'),
                $request->input('data', [])
            );

            if ($result['success']) {
                return response()->json($result, 200);
            } else {
                return response()->json($result, 400);
            }
        } catch (\Exception $e) {
            Log::error('Erreur envoi notification par token: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'envoi de la notification'
            ], 500);
        }
    }

    /**
     * Mettre à jour le token FCM d'un utilisateur
     */
    #[OA\Post(
        path: "/notifications/update-token",
        summary: "Mettre à jour le token FCM d'un utilisateur",
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["id_utilisateur", "fcm_token"],
                properties: [
                    new OA\Property(property: "id_utilisateur", type: "integer", example: 1),
                    new OA\Property(property: "fcm_token", type: "string", example: "fcm_token_here")
                ]
            )
        ),
        tags: ["Notifications"],
        security: [["bearerAuth" => []]],
        responses: [
            new OA\Response(response: 200, description: "Token mis à jour avec succès")
        ]
    )]
    public function updateToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_utilisateur' => 'required|integer',
            'fcm_token' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $result = $this->fcmService->updateUserFcmToken(
                $request->input('id_utilisateur'),
                $request->input('fcm_token')
            );

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'FCM token updated successfully'
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to update FCM token'
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Erreur mise à jour FCM token: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la mise à jour du token'
            ], 500);
        }
    }

    /**
     * Vérifier si le service FCM est disponible
     */
    #[OA\Get(
        path: "/notifications/status",
        summary: "Vérifier le statut du service de notifications",
        tags: ["Notifications"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Statut du service",
                content: new OA\JsonContent(properties: [
                    new OA\Property(property: "available", type: "boolean", example: true),
                    new OA\Property(property: "message", type: "string", example: "FCM Service is available")
                ])
            )
        ]
    )]
    public function status()
    {
        $isAvailable = $this->fcmService->isAvailable();
        
        return response()->json([
            'available' => $isAvailable,
            'message' => $isAvailable ? 'FCM Service is available' : 'FCM Service is not available'
        ], 200);
    }
}
