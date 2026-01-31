<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;
    use \Illuminate\Database\Eloquent\SoftDeletes;

    protected $table = 'utilisateur';
    protected $primaryKey = 'id_utilisateur';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'identifiant',
        'mdp',
        'nom',
        'prenom',
        'dtn',
        'email',
        'firebase_uid',
        'id_sexe',
        'id_type_utilisateur',
        'synchronized',
        'last_sync_at',
    ];

    public $timestamps = false;

    protected $dates = ['deleted_at'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'mdp',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dtn' => 'date',
            'mdp' => 'hashed',
            'synchronized' => 'boolean',
            'last_sync_at' => 'datetime',
        ];
    }

    /**
     * Get the password for authentication.
     */
    public function getAuthPassword()
    {
        return $this->mdp;
    }

    /**
     * Get the name of the unique identifier for the user.
     */
    public function getAuthIdentifierName()
    {
        return 'id_utilisateur';
    }

    /**
     * Get the column name for the "username" used for authentication.
     */
    public function username()
    {
        return 'email';
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    /**
     * Relation avec Sexe
     */
    public function sexe()
    {
        return $this->belongsTo(Sexe::class, 'id_sexe', 'id_sexe');
    }

    /**
     * Relation avec TypeUtilisateur
     */
    public function typeUtilisateur()
    {
        return $this->belongsTo(TypeUtilisateur::class, 'id_type_utilisateur', 'id_type_utilisateur');
    }

    /**
     * Relation avec StatutUtilisateur
     */
    public function statuts()
    {
        return $this->hasMany(StatutUtilisateur::class, 'id_utilisateur', 'id_utilisateur');
    }
}
