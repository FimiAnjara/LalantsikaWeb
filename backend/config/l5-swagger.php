<?php

return [
    'default' => 'default',
    'documentations' => [
        'default' => [
            'api' => [
                'title' => 'API Signalement Lalantsika',
            ],
            'routes' => [
                'api' => 'api/documentation',
                'docs' => 'docs',
            ],
            'paths' => [
                'docs' => storage_path('api-docs'),
                'annotations' => [
                    base_path('app/Swagger/api-docs.php'),  # Fichier principal
                    base_path('app/Http/Controllers/Api'),   # Contrôleurs API
                ],
            ],
        ],
    ],
    'defaults' => [
        'generate_always' => true,
        'generate_yaml_copy' => false,
    ],
];
