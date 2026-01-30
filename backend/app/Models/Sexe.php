<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sexe extends Model
{
    protected $table = 'sexe';
    protected $primaryKey = 'id_sexe';
    public $timestamps = false;

    protected $fillable = [
        'libelle',
    ];
}
