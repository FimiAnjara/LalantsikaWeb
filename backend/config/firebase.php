<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase REST API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour Firebase Realtime Database et firestore via REST API
    | Pas besoin de gRPC ni du SDK Kreait
    |
    */

    'project_id' => env('FIREBASE_PROJECT', 'lalantsika-project'),
    
    'database_url' => env('FIREBASE_DATABASE_URL', 'https://lalantsika-project-default-rtdb.asia-southeast1.firebasedatabase.app'),
    
    'api_key' => env('FIREBASE_API_KEY', ''),
    
    'auth_domain' => env('FIREBASE_AUTH_DOMAIN', 'lalantsika-project.firebaseapp.com'),
];
