<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Point extends Model
{
    protected $table = 'point';
    protected $primaryKey = 'id_point';
    public $timestamps = false;

    protected $fillable = [
        'coordonnee',
    ];

    /**
     * Récupère les coordonnées lat/lng du point
     */
    public function getCoordinatesAttribute()
    {
        if (!$this->id_point) {
            return null;
        }
        
        $result = DB::selectOne("
            SELECT 
                ST_Y(coordonnee::geometry) as latitude,
                ST_X(coordonnee::geometry) as longitude
            FROM point 
            WHERE id_point = ?
        ", [$this->id_point]);
        
        return $result ? [
            'latitude' => $result->latitude,
            'longitude' => $result->longitude,
        ] : null;
    }

    public function signalement()
    {
        return $this->hasOne(Signalement::class, 'id_point', 'id_point');
    }
}
