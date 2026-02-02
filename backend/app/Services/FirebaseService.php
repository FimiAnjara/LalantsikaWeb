<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Database;

class FirebaseService
{
    protected $database;

    public function __construct()
    {
        $factory = (new Factory)->withServiceAccount(config('firebase.projects.lalantsika-project.credentials'));
        $this->database = $factory->createDatabase(config('firebase.projects.lalantsika-project.database_url'));
    }

    public function getDatabase(): Database
    {
        return $this->database;
    }
}
