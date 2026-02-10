<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tarif extends Model
{
    protected $table = 'tarif';
    protected $primaryKey = 'id_prix';
    public $timestamps = false;

    protected $fillable = [
        'montant',
        'date_'
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_' => 'datetime'
    ];
}