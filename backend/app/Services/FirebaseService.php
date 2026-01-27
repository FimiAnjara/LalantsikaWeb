<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth;

class FirebaseService
{
    protected $auth;

    public function __construct()
    {
        $serviceAccountPath = storage_path('app/firebase/service-account.json');
        
        $factory = (new Factory)->withServiceAccount($serviceAccountPath);
        
        $this->auth = $factory->createAuth();
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
