<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Signalement extends Model
{
    protected $table = 'signalement';
    protected $primaryKey = 'id_signalement';
    public $timestamps = false;

    protected $fillable = [
        'daty',
        'surface',
        'budget',
        'description',
        'id_entreprise',
        'id_utilisateur',
        'point',
        'synchronized',
        'last_sync_at'
    ];

    protected $casts = [
        'daty' => 'datetime',
        'surface' => 'decimal:2',
        'budget' => 'decimal:2',
        'synchronized' => 'boolean',
        'last_sync_at' => 'datetime'
    ];

    // Relations
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function statut()
    {
        return $this->belongsTo(Statut::class, 'id_statut', 'id_statut');
    }

    public function entreprise()
    {
        return $this->belongsTo(Entreprise::class, 'id_entreprise', 'id_entreprise');
    }

    public function histoStatuts()
    {
        return $this->hasMany(HistoStatut::class, 'id_signalement', 'id_signalement');
    }

    public function images()
    {
        return $this->hasMany(ImageSignalement::class, 'id_signalement', 'id_signalement');
    }
}
