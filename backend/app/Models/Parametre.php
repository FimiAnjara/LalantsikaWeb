<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Parametre extends Model
{
    protected $table = 'parametre';
    
    protected $primaryKey = 'id_parametre';
    
    protected $fillable = [
        'tentative_max',
        'synchronized',
        'last_sync_at'
    ];

    protected $casts = [
        'synchronized' => 'boolean',
        'last_sync_at' => 'datetime',
    ];

    public $timestamps = false; // Pas de created_at/updated_at dans cette table

    /**
     * Scope pour récupérer seulement les paramètres synchronisés
     */
    public function scopeSynchronized($query)
    {
        return $query->where('synchronized', true);
    }

    /**
     * Méthode statique pour récupérer la valeur de tentative_max
     */
    public static function getTentativeMax($defaut = 3)
    {
        $parametre = static::first();
        return $parametre ? $parametre->tentative_max : $defaut;
    }
}