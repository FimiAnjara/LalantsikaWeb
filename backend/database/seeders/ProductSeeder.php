<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = Category::factory()->count(5)->create();
        
        foreach ($categories as $category) {
            Product::factory()->count(3)->create([
                'category_id' => $category->id,
            ]);
        }
    }
}
