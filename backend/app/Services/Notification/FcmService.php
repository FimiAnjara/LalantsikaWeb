<?php

namespace App\Services\Notification;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use App\Services\Firebase\FirebaseRestService;
use Illuminate\Support\Facades\Log;

/**
 * Service FCM pour l'envoi de notifications push
 * Utilise Firebase Cloud Messaging pour envoyer des notifications aux utilisateurs
 */
class FcmService
{
    protected $messaging;
    protected $firebaseRest;
    protected $isAvailable = false;

    public function __construct(FirebaseRestService $firebaseRest)
    {
        $this->firebaseRest = $firebaseRest;
        
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
            Log::info("🔍 Recherche FCM token pour utilisateur: {$idUtilisateur} (Firestore REST API)");
            
            // Utiliser queryCollection pour chercher par id_utilisateur
            $results = $this->firebaseRest->queryCollection('utilisateurs', [
                'id_utilisateur' => (int)$idUtilisateur
            ]);
            
            if (empty($results)) {
                Log::warning("⚠️  Utilisateur avec id_utilisateur={$idUtilisateur} non trouvé dans Firestore");
                return null;
            }
            
            // Récupérer le premier résultat
            $userData = reset($results);
            
            Log::info("✅ Utilisateur trouvé dans Firestore (REST API)");
            
            if (isset($userData['fcm_token']) && !empty($userData['fcm_token'])) {
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
     * Récupère le FCM token d'un utilisateur depuis PostgreSQL
     * Alternative à getUserFcmToken() qui ne nécessite pas gRPC
     * 
     * @param int|string $idUtilisateur L'ID de l'utilisateur
     * @return string|null Le token FCM ou null si non trouvé
     */
    public function getUserFcmTokenFromPostgres($idUtilisateur): ?string
    {
        try {
            Log::info("🔍 Recherche FCM token pour utilisateur: {$idUtilisateur} (PostgreSQL)");
            
            // Récupérer l'utilisateur depuis PostgreSQL
            $user = \App\Models\User::where('id_utilisateur', (int)$idUtilisateur)->first();
            
            if (!$user) {
                Log::warning("⚠️  Utilisateur avec id_utilisateur={$idUtilisateur} non trouvé dans PostgreSQL");
                return null;
            }
            
            Log::info("✅ Utilisateur trouvé dans PostgreSQL: {$user->email}");
            
            if (!empty($user->fcm_token)) {
                Log::info("✅ FCM token trouvé pour user {$idUtilisateur}: " . substr($user->fcm_token, 0, 20) . "...");
                return $user->fcm_token;
            }
            
            Log::warning("⚠️  Utilisateur {$idUtilisateur} existe mais n'a pas de fcm_token");
            return null;
        } catch (\Exception $e) {
            Log::error("❌ Erreur récupération FCM token pour user {$idUtilisateur}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Met à jour le FCM token d'un utilisateur dans Firestore ET PostgreSQL
     * 
     * @param int|string $idUtilisateur L'ID de l'utilisateur
     * @param string $fcmToken Le nouveau token FCM
     * @return bool Succès de l'opération
     */
    public function updateUserFcmToken($idUtilisateur, string $fcmToken): bool
    {
        try {
            $firestoreSuccess = false;
            $postgresSuccess = false;

            // 1. Mettre à jour dans Firestore (via REST API)
            // Chercher le document par le champ id_utilisateur
            $results = $this->firebaseRest->queryCollection('utilisateurs', [
                'id_utilisateur' => (int)$idUtilisateur
            ]);
            
            if (!empty($results)) {
                // Récupérer le document ID (clé du tableau)
                $documentId = key($results);
                $userData = reset($results);
                
                if ($documentId) {
                    // Mettre à jour le document avec le nouveau token
                    $userData['fcm_token'] = $fcmToken;
                    $userData['synchronized'] = false;
                    
                    $firestoreSuccess = $this->firebaseRest->saveDocument('utilisateurs', $documentId, $userData);
                    
                    if ($firestoreSuccess) {
                        Log::info("✅ Firestore (REST): FCM token mis à jour pour user {$idUtilisateur} (document: {$documentId})");
                    } else {
                        Log::error("❌ Firestore (REST): Échec mise à jour FCM token pour user {$idUtilisateur}");
                    }
                } else {
                    Log::warning("⚠️  Document ID non trouvé dans Firestore pour utilisateur {$idUtilisateur}");
                }
            } else {
                Log::warning("⚠️  Utilisateur avec id_utilisateur={$idUtilisateur} non trouvé dans Firestore");
            }

            // 2. Mettre à jour dans PostgreSQL
            $user = \App\Models\User::where('id_utilisateur', (int)$idUtilisateur)->first();
            
            if ($user) {
                $user->fcm_token = $fcmToken;
                $user->synchronized = false;  // Marquer comme non synchronisé pour forcer une future sync
                $postgresSuccess = $user->save();
                
                if ($postgresSuccess) {
                    Log::info("✅ PostgreSQL: FCM token mis à jour pour user {$idUtilisateur}");
                } else {
                    Log::error("❌ PostgreSQL: Échec mise à jour FCM token pour user {$idUtilisateur}");
                }
            } else {
                Log::warning("⚠️  Utilisateur avec id_utilisateur={$idUtilisateur} non trouvé dans PostgreSQL");
            }

            // Considérer comme succès si au moins une base de données a été mise à jour
            $success = $firestoreSuccess || $postgresSuccess;
            
            if ($success) {
                Log::info("✅ FCM token mis à jour avec succès pour utilisateur {$idUtilisateur} (Firestore: " . ($firestoreSuccess ? 'OK' : 'SKIP') . ", PostgreSQL: " . ($postgresSuccess ? 'OK' : 'SKIP') . ")");
            } else {
                Log::error("❌ Échec total de mise à jour FCM token pour utilisateur {$idUtilisateur}");
            }
            
            return $success;
        } catch (\Exception $e) {
            Log::error("❌ Erreur mise à jour FCM token pour user {$idUtilisateur}: " . $e->getMessage());
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
            // Utiliser PostgreSQL par défaut (pas besoin de gRPC)
            $fcmToken = $this->getUserFcmToken($idUtilisateur);
            
            // Fallback sur Firestore si pas trouvé dans PostgreSQL
            if (!$fcmToken) {
                Log::info("⚠️  Token non trouvé dans PostgreSQL, tentative Firestore...");
                try {
                    $fcmToken = $this->getUserFcmToken($idUtilisateur);
                } catch (\Exception $e) {
                    Log::warning("⚠️  Firestore inaccessible (gRPC non installé): " . $e->getMessage());
                }
            }
            
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

    /**
     * Envoie une notification de changement de statut d'un signalement
     * 
     * @param int|string $idUtilisateur L'ID du propriétaire du signalement
     * @param int $idSignalement L'ID du signalement
     * @param string $statutLibelle Le libellé du nouveau statut
     * @param string|null $location Le lieu/adresse du signalement (optionnel)
     * @return array Résultat de l'envoi
     */
    public function notifySignalementStatusChange($idUtilisateur, int $idSignalement, string $statutLibelle, ?string $location = null): array
    {
        if (!$this->isAvailable) {
            return [
                'success' => false,
                'error' => 'FCM Service not available'
            ];
        }

        try {
            $title = 'Changement de statut';
            
            // Construire le message selon la présence de la localisation
            if ($location) {
                $body = "Le statut de votre signalement près de {$location} a été modifié en {$statutLibelle}";
            } else {
                $body = "Le statut de votre signalement a été modifié en {$statutLibelle}";
            }
            
            $data = [
                'type' => 'signalement_status_change',
                'signalement_id' => (string)$idSignalement,
                'statut' => $statutLibelle,
                'click_action' => 'OPEN_SIGNALEMENT'
            ];
            
            Log::info("📲 Envoi notification changement statut - User: {$idUtilisateur}, Signalement: {$idSignalement}, Statut: {$statutLibelle}");
            
            return $this->sendToUser($idUtilisateur, $title, $body, $data);
            
        } catch (\Exception $e) {
            Log::error("❌ Erreur notification changement statut: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
