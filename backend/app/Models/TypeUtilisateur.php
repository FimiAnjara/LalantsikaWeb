<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeUtilisateur extends Model
{
    protected $table = 'type_utilisateur';
    protected $primaryKey = 'id_type_utilisateur';
    public $timestamps = false;

    protected $fillable = [
        'libelle',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'id_type_utilisateur', 'id_type_utilisateur');
    }
}
