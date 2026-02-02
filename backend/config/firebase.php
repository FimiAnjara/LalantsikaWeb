<?php

return [
    'projects' => [
        'default' => env('FIREBASE_PROJECT', 'lalantsika-project'),
        
        'lalantsika-project' => [
            'credentials' => storage_path('app/firebase/service-account.json'),
            'database_url' => env('FIREBASE_DATABASE_URL', 'https://lalantsika-project-default-rtdb.asia-southeast1.firebasedatabase.app'),
        ],
    ],
];
