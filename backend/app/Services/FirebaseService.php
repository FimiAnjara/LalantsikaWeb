<?php

namespace App\Services;

use App\Services\Firebase\FirebaseRestService;

/**
 * @deprecated Use FirebaseRestService instead
 * Cette classe est conservée pour la compatibilité mais délègue à FirebaseRestService
 */
class FirebaseService
{
    protected $firebaseRestService;

    public function __construct()
    {
        $this->firebaseRestService = app(FirebaseRestService::class);
    }

    public function getDatabase()
    {
        return $this->firebaseRestService;
    }
}
