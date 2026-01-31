<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistoStatut extends Model
{
    protected $table = 'histo_statut';
    protected $primaryKey = 'id_histo_statut';
    public $timestamps = false;

    protected $fillable = [
        'daty',
        'image',
        'description',
        'id_statut',
        'id_signalement',
    ];

    public function statut()
    {
        return $this->belongsTo(Statut::class, 'id_statut', 'id_statut');
    }

    public function signalement()
    {
        return $this->belongsTo(Signalement::class, 'id_signalement', 'id_signalement');
    }
}