<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Statut extends Model
{
    protected $table = 'statut';
    protected $primaryKey = 'id_statut';
    public $timestamps = false;

    protected $fillable = [
        'libelle',
    ];

    public function signalements()
    {
        return $this->hasMany(Signalement::class, 'id_statut', 'id_statut');
    }
}
