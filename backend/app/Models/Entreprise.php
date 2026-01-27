<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entreprise extends Model
{
    protected $table = 'entreprise';
    protected $primaryKey = 'id_entreprise';
    public $timestamps = false;

    protected $fillable = [
        'nom_entreprise',
        'adresse',
        'tel',
        'id_utilisateur',
        'synchronized',
        'last_sync_at'
    ];

    protected $casts = [
        'synchronized' => 'boolean',
        'last_sync_at' => 'datetime'
    ];

    // Relation avec utilisateur
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }
}
