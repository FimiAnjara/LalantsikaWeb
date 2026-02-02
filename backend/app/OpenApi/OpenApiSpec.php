<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\OpenApi(
    info: new OA\Info(
        title: "API Signalement Lalantsika",
        version: "1.0.0",
        description: "Documentation de l'API pour la gestion des signalements et entreprises."
    ),
    servers: [
        new OA\Server(url: "http://localhost:8000/api", description: "API principale")
    ],
    components: new OA\Components(
        securitySchemes: [
            new OA\SecurityScheme(
                securityScheme: "bearerAuth",
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            )
        ]
    )
)]
#[OA\PathItem(
    path: "/api/health",
    get: new OA\Get(
        tags: ["Health"],
        summary: "Check API status",
        responses: [
            new OA\Response(
                response: 200,
                description: "API is running"
            )
        ]
    )
)]
class OpenApiSpec {}
