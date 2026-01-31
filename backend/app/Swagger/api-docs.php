<?php

/**
 * Documentation complète de l'API Signalement Lalantsika
 */

/**
 * @OA\OpenApi(
 *     openapi="3.0.0",
 *     info=@OA\Info(
 *         title="API Signalement Lalantsika",
 *         version="1.0.0",
 *         description="Documentation de l'API pour la gestion des signalements et entreprises."
 *     ),
 *     servers={
 *         @OA\Server(url="/api", description="API principale")
 *     },
 *     paths={
 *         @OA\PathItem(
 *             path="/api/test",
 *             get=@OA\Get(
 *                 tags={"Test"},
 *                 summary="Test endpoint",
 *                 responses={
 *                     @OA\Response(response=200, description="Success")
 *                 }
 *             )
 *         ),
 *         @OA\PathItem(
 *             path="/api/health",
 *             get=@OA\Get(
 *                 tags={"Health"},
 *                 summary="Health check",
 *                 responses={
 *                     @OA\Response(response=200, description="API status")
 *                 }
 *             )
 *         )
 *     },
 *     components={
 *         @OA\Components(
 *             securitySchemes={
 *                 @OA\SecurityScheme(
 *                     securityScheme="bearerAuth",
 *                     type="http",
 *                     scheme="bearer",
 *                     bearerFormat="JWT"
 *                 )
 *             }
 *         )
 *     }
 * )
 */
