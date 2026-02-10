<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tarif;

class TarifSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Tarif::create([
            'montant' => 5000.00, // Prix par m² en Ariary
            'date_' => now(),
        ]);
    }
}
