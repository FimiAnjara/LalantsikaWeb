<?php

namespace App\Http\Controllers;

use App\Models\Sexe;
use Illuminate\Container\Attributes\Log;
use Illuminate\Http\Request;

class SexeController extends Controller
{
    /**
     * Get all sexes
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $sexes = Sexe::all();
            
            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Sexes retrieved successfully',
                'data' => $sexes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'code' => 500,
                'success' => false,
                'message' => 'Failed to retrieve sexes',
                'data' => ['error' => $e->getMessage()]
            ], 500);
        }
    }
}
