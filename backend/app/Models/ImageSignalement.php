<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImageSignalement extends Model
{
    use HasFactory;

    protected $table = 'image_signalement';
    protected $primaryKey = 'id_image_signalement';
    
    public $timestamps = false;

    protected $fillable = [
        'image',
        'id_histo_statut',
        'synchronized',
        'last_sync_at',
    ];

    protected $casts = [
        'synchronized' => 'boolean',
        'last_sync_at' => 'datetime',
    ];

    /**
     * Relation vers HistoStatut
     */
    public function histoStatut()
    {
        return $this->belongsTo(HistoStatut::class, 'id_histo_statut', 'id_histo_statut');
    }
}