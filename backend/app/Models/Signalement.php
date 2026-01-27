<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Signalement extends Model
{
    protected $table = 'signalement';
    protected $primaryKey = 'id_signalement';
    public $timestamps = false;

    protected $fillable = [
        'description',
        'id_point',
        'id_utilisateur',
        'date_signalement',
        'synchronized',
        'last_sync_at'
    ];

    protected $casts = [
        'date_signalement' => 'datetime',
        'synchronized' => 'boolean',
        'last_sync_at' => 'datetime'
    ];

    // Relations
    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function point()
    {
        return $this->belongsTo(Point::class, 'id_point', 'id_point');
    }
}
