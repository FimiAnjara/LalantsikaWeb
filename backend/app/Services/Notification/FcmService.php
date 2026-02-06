<?php

namespace App\Services\Notification;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use App\Services\Firebase\FirestoreService;
use Illuminate\Support\Facades\Log;

/**
 * Service FCM pour l'envoi de notifications push
 * Utilise Firebase Cloud Messaging pour envoyer des notifications aux utilisateurs
 */
class FcmService
{
    protected $messaging;
    protected $firestore;
    protected $isAvailable = false;

    public function __construct(FirestoreService $firestore)
    {
        $this->firestore = $firestore;
        
        try {
            $serviceAccountPath = storage_path('app/firebase/service-account.json');
            
            if (!file_exists($serviceAccountPath)) {
                throw new \Exception('Firebase credentials file not found');
            }

            $factory = (new Factory)->withServiceAccount($serviceAccountPath);
            $this->messaging = $factory->createMessaging();
            $this->isAvailable = true;
            
            Log::info('✅ FCM Service initialized successfully');
        } catch (\Exception $e) {
            Log::error('❌ FCM Service initialization failed: ' . $e->getMessage());
            $this->isAvailable = false;
        }
    }

    /**
     * Vérifie si le service FCM est disponible
     */
    public function isAvailable(): bool
    {
        return $this->isAvailable;
    }

    /**
     * Récupère le FCM token d'un utilisateur depuis Firestore
     * 
     * @param int|string $idUtilisateur L'ID de l'utilisateur
     * @return string|null Le token FCM ou null si non trouvé
     */
    public function getUserFcmToken($idUtilisateur): ?string
    {
        try {
            Log::info("🔍 Recherche FCM token pour utilisateur: {$idUtilisateur}");
            
            // Chercher par le champ id_utilisateur (pas par l'ID du document)
            $userData = $this->firestore->getFromCollectionByField('utilisateurs', 'id_utilisateur', (int)$idUtilisateur);
            
            if (!$userData) {
                Log::warning("⚠️  Utilisateur avec id_utilisateur={$idUtilisateur} non trouvé dans Firestore collection 'utilisateurs'");
                return null;
            }
            
            Log::info("✅ Utilisateur trouvé dans Firestore, données: " . json_encode($userData));
            
            if (isset($userData['fcm_token'])) {
                Log::info("✅ FCM token trouvé pour user {$idUtilisateur}: " . substr($userData['fcm_token'], 0, 20) . "...");
                return $userData['fcm_token'];
            }
            
            Log::warning("⚠️  Utilisateur {$idUtilisateur} existe mais n'a pas de fcm_token");
            return null;
        } catch (\Exception $e) {
            Log::error("❌ Erreur récupération FCM token pour user {$idUtilisateur}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Met à jour le FCM token d'un utilisateur dans Firestore
     * 
     * @param int|string $idUtilisateur L'ID de l'utilisateur
     * @param string $fcmToken Le nouveau token FCM
     * @return bool Succès de l'opération
     */
    public function updateUserFcmToken($idUtilisateur, string $fcmToken): bool
    {
        try {
            // Chercher le document par le champ id_utilisateur
            $userData = $this->firestore->getFromCollectionByField('utilisateurs', 'id_utilisateur', (int)$idUtilisateur);
            
            if (!$userData) {
                Log::warning("Utilisateur avec id_utilisateur={$idUtilisateur} non trouvé dans Firestore");
                return false;
            }

            // Récupérer l'ID du document Firestore (si disponible)
            // Note: getFromCollectionByField retourne les données mais pas l'ID du document
            // Il faut chercher le document pour avoir son ID
            $query = $this->firestore->collection('utilisateurs')
                ->where('id_utilisateur', '=', (int)$idUtilisateur)
                ->documents();
            
            $documentId = null;
            foreach ($query as $document) {
                if ($document->exists()) {
                    $documentId = $document->id();
                    break;
                }
            }
            
            if (!$documentId) {
                Log::warning("Document ID non trouvé pour utilisateur {$idUtilisateur}");
                return false;
            }

            // Mettre à jour avec le nouveau token
            $updateData = [
                'fcm_token' => $fcmToken,
                'fcm_token_updated_at' => date('c'),
                'synchronized' => false
            ];
            
            $result = $this->firestore->updateInCollection('utilisateurs', $documentId, $updateData);
            
            if ($result) {
                Log::info("✅ FCM token mis à jour pour user {$idUtilisateur} (document: {$documentId})");
            }
            
            return $result;
        } catch (\Exception $e) {
            Log::error("Erreur mise à jour FCM token pour user {$idUtilisateur}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie une notification à un utilisateur spécifique
     * 
     * @param int|string $idUtilisateur L'ID de l'utilisateur
     * @param string $title Titre de la notification
     * @param string $body Corps de la notification
     * @param array $data Données supplémentaires (optionnel)
     * @return array Résultat de l'envoi
     */
    public function sendToUser($idUtilisateur, string $title, string $body, array $data = []): array
    {
        if (!$this->isAvailable) {
            return [
                'success' => false,
                'error' => 'FCM Service not available'
            ];
        }

        try {
            $fcmToken = $this->getUserFcmToken($idUtilisateur);
            
            if (!$fcmToken) {
                return [
                    'success' => false,
                    'error' => "FCM token not found for user {$idUtilisateur}"
                ];
            }

            return $this->sendToToken($fcmToken, $title, $body, $data);
        } catch (\Exception $e) {
            Log::error("Erreur envoi notification à user {$idUtilisateur}: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Envoie une notification à un token FCM spécifique
     * 
     * @param string $fcmToken Le token FCM
     * @param string $title Titre de la notification
     * @param string $body Corps de la notification
     * @param array $data Données supplémentaires (optionnel)
     * @return array Résultat de l'envoi
     */
    public function sendToToken(string $fcmToken, string $title, string $body, array $data = []): array
    {
        if (!$this->isAvailable) {
            return [
                'success' => false,
                'error' => 'FCM Service not available'
            ];
        }

        try {
            $notification = Notification::create($title, $body);
            
            $message = CloudMessage::withTarget('token', $fcmToken)
                ->withNotification($notification);
            
            // Ajouter les données supplémentaires si présentes
            if (!empty($data)) {
                // Convertir toutes les valeurs en string (requis par FCM)
                $stringData = array_map('strval', $data);
                $message = $message->withData($stringData);
            }

            $this->messaging->send($message);
            
            Log::info("✅ Notification envoyée: {$title}");
            
            return [
                'success' => true,
                'message' => 'Notification sent successfully'
            ];
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            
            // Gérer les tokens invalides
            if (str_contains($errorMessage, 'not-registered') || 
                str_contains($errorMessage, 'invalid-registration-token')) {
                Log::warning("Token FCM invalide ou expiré");
                return [
                    'success' => false,
                    'error' => 'Invalid or expired FCM token',
                    'should_remove_token' => true
                ];
            }
            
            Log::error("Erreur envoi notification: " . $errorMessage);
            return [
                'success' => false,
                'error' => $errorMessage
            ];
        }
    }

    /**
     * Envoie une notification à plusieurs utilisateurs
     * 
     * @param array $idUtilisateurs Liste des IDs utilisateurs
     * @param string $title Titre de la notification
     * @param string $body Corps de la notification
     * @param array $data Données supplémentaires (optionnel)
     * @return array Résultat de l'envoi
     */
    public function sendToMultipleUsers(array $idUtilisateurs, string $title, string $body, array $data = []): array
    {
        if (!$this->isAvailable) {
            return [
                'success' => false,
                'error' => 'FCM Service not available'
            ];
        }

        $results = [
            'total' => count($idUtilisateurs),
            'success' => 0,
            'failed' => 0,
            'errors' => []
        ];

        foreach ($idUtilisateurs as $idUtilisateur) {
            $result = $this->sendToUser($idUtilisateur, $title, $body, $data);
            
            if ($result['success']) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = [
                    'user_id' => $idUtilisateur,
                    'error' => $result['error'] ?? 'Unknown error'
                ];
            }
        }

        return $results;
    }

    /**
     * Envoie une notification à plusieurs tokens FCM
     * 
     * @param array $tokens Liste des tokens FCM
     * @param string $title Titre de la notification
     * @param string $body Corps de la notification
     * @param array $data Données supplémentaires (optionnel)
     * @return array Résultat de l'envoi
     */
    public function sendToMultipleTokens(array $tokens, string $title, string $body, array $data = []): array
    {
        if (!$this->isAvailable) {
            return [
                'success' => false,
                'error' => 'FCM Service not available'
            ];
        }

        if (empty($tokens)) {
            return [
                'success' => false,
                'error' => 'No tokens provided'
            ];
        }

        try {
            $notification = Notification::create($title, $body);
            
            $message = CloudMessage::new()
                ->withNotification($notification);
            
            if (!empty($data)) {
                $stringData = array_map('strval', $data);
                $message = $message->withData($stringData);
            }

            $report = $this->messaging->sendMulticast($message, $tokens);
            
            Log::info("✅ Multicast envoyé: {$report->successes()->count()} succès, {$report->failures()->count()} échecs");
            
            return [
                'success' => true,
                'successes' => $report->successes()->count(),
                'failures' => $report->failures()->count(),
                'invalid_tokens' => $this->extractInvalidTokens($report)
            ];
        } catch (\Exception $e) {
            Log::error("Erreur envoi multicast: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Extrait les tokens invalides du rapport d'envoi multicast
     */
    private function extractInvalidTokens($report): array
    {
        $invalidTokens = [];
        
        foreach ($report->failures()->getItems() as $failure) {
            $error = $failure->error();
            if ($error && (str_contains($error->getMessage(), 'not-registered') || 
                          str_contains($error->getMessage(), 'invalid-registration-token'))) {
                // On pourrait récupérer le token ici si nécessaire
                $invalidTokens[] = $failure->target()->value();
            }
        }
        
        return $invalidTokens;
    }

    /**
     * Envoie une notification de nouveau signalement
     * 
     * @param int|string $idUtilisateur L'ID de l'utilisateur à notifier
     * @param array $signalementData Données du signalement
     * @return array Résultat de l'envoi
     */
    public function notifyNewSignalement($idUtilisateur, array $signalementData): array
    {
        $title = 'Nouveau signalement';
        $body = $signalementData['description'] ?? 'Un nouveau signalement a été créé';
        
        $data = [
            'type' => 'new_signalement',
            'signalement_id' => $signalementData['id_signalement'] ?? '',
            'click_action' => 'OPEN_SIGNALEMENT'
        ];
        
        return $this->sendToUser($idUtilisateur, $title, $body, $data);
    }

    /**
     * Envoie une notification de mise à jour de statut
     * 
     * @param int|string $idUtilisateur L'ID de l'utilisateur à notifier
     * @param string $newStatus Le nouveau statut
     * @param array $signalementData Données du signalement
     * @return array Résultat de l'envoi
     */
    public function notifyStatusUpdate($idUtilisateur, string $newStatus, array $signalementData): array
    {
        $statusLabels = [
            'en_attente' => 'En attente',
            'en_cours' => 'En cours de traitement',
            'resolu' => 'Résolu',
            'rejete' => 'Rejeté'
        ];
        
        $title = 'Mise à jour de votre signalement';
        $body = 'Statut: ' . ($statusLabels[$newStatus] ?? $newStatus);
        
        $data = [
            'type' => 'status_update',
            'signalement_id' => $signalementData['id_signalement'] ?? '',
            'new_status' => $newStatus,
            'click_action' => 'OPEN_SIGNALEMENT'
        ];
        
        return $this->sendToUser($idUtilisateur, $title, $body, $data);
    }
}
