<?php

namespace App\Swagger;

/**
 * @OA\Info(
 *     title="API Signalement Lalantsika",
 *     version="1.0.0",
 *     description="Documentation de l'API pour la gestion des signalements et entreprises."
 * )
 * 
 * @OA\Server(
 *     url="/api",
 *     description="API principale"
 * )
 * 
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT"
 * )
 */
class SwaggerAnnotations
{
    // Cette classe sert uniquement de conteneur pour les annotations
}
