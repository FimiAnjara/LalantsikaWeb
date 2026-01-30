<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatutUtilisateur extends Model
{
    protected $table = 'statut_utilisateur';
    protected $primaryKey = 'id_statut_utilisateur';
    public $timestamps = false;

    protected $fillable = [
        'date_',
        'etat',
        'id_utilisateur',
    ];

    protected $casts = [
        'date_' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }
}
