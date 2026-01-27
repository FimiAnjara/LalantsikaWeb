<?php

namespace App\Services\Firebase;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth;

/**
 * Service d'authentification Firebase
 * Gère la création, modification et suppression des utilisateurs Firebase Auth
 */
class AuthService
{
    protected $auth;

    public function __construct()
    {
        $serviceAccountPath = storage_path('app/firebase/service-account.json');
        
        $factory = (new Factory)->withServiceAccount($serviceAccountPath);
        
        $this->auth = $factory->createAuth();
    }

    /**
     * Créer un utilisateur dans Firebase Authentication
     */
    public function createUser(string $email, string $password, array $properties = [])
    {
        try {
            $userProperties = [
                'email' => $email,
                'password' => $password,
                'emailVerified' => false
            ];

            if (isset($properties['displayName'])) {
                $userProperties['displayName'] = $properties['displayName'];
            }
            if (isset($properties['phoneNumber'])) {
                $userProperties['phoneNumber'] = $properties['phoneNumber'];
            }

            return $this->auth->createUser($userProperties);
        } catch (\Exception $e) {
            throw new \Exception('Failed to create Firebase user: ' . $e->getMessage());
        }
    }

    /**
     * Mettre à jour un utilisateur Firebase
     */
    public function updateUser(string $uid, array $properties)
    {
        try {
            return $this->auth->updateUser($uid, $properties);
        } catch (\Exception $e) {
            throw new \Exception('Failed to update Firebase user: ' . $e->getMessage());
        }
    }

    /**
     * Supprimer un utilisateur Firebase
     */
    public function deleteUser(string $uid)
    {
        try {
            $this->auth->deleteUser($uid);
            return true;
        } catch (\Exception $e) {
            throw new \Exception('Failed to delete Firebase user: ' . $e->getMessage());
        }
    }

    /**
     * Verify Firebase ID Token
     */
    public function verifyIdToken(string $idToken)
    {
        try {
            $verifiedIdToken = $this->auth->verifyIdToken($idToken);
            return $verifiedIdToken;
        } catch (\Exception $e) {
            throw new \Exception('Invalid Firebase token: ' . $e->getMessage());
        }
    }

    /**
     * Get user by Firebase UID
     */
    public function getUserByUid(string $uid)
    {
        try {
            return $this->auth->getUser($uid);
        } catch (\Exception $e) {
            throw new \Exception('User not found: ' . $e->getMessage());
        }
    }

    /**
     * Create a custom token for a user
     */
    public function createCustomToken(string $uid, array $claims = [])
    {
        try {
            return $this->auth->createCustomToken($uid, $claims);
        } catch (\Exception $e) {
            throw new \Exception('Failed to create custom token: ' . $e->getMessage());
        }
    }

    /**
     * Get Firebase Auth instance
     */
    public function getAuth(): Auth
    {
        return $this->auth;
    }
}
