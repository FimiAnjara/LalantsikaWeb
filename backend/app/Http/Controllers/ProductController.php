<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Http\Requests\StoreProductRequest;


class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $categories = Category::active()->get();

        // Requête avec eager loading
        $query = Product::with('category');

        // Recherche par nom
        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filtre par catégorie
        if ($request->has('category_id') && $request->category_id != '') {
            $query->where('category_id', $request->category_id);
        }

        // Tri par prix
        $sort = $request->get('sort', 'asc');
        if (in_array($sort, ['asc', 'desc'])) {
            $query->orderBy('price', $sort);
        } else {
            $query->orderBy('name');
        }

        $products = $query->paginate(10);

        // Compter les produits par catégorie
        $productsByCategory = Category::withCount('products')->get();

        return view('products.index', compact('products', 'categories', 'sort', 'productsByCategory'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = Category::active()->get();
        return view('products.create', compact('categories'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validated();
        $validated['slug'] = Str::slug($validated['name']);
        
        Product::create($validated);
        
        return redirect()->route('products.index')
            ->with('success', 'Produit créé avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load('category');
        return view('products.show', compact('product'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        $categories = Category::active()->get();
        return view('products.edit', compact('product', 'categories'));
    }

    /**
     * Update the specified resource in storage.
     */
     public function update(StoreProductRequest $request, Product $product) 
    {
        $validated = $request->validated();
        
        if ($validated['name'] !== $product->name) {
            $validated['slug'] = Str::slug($validated['name']);
        }
        
        $product->update($validated);
        
        return redirect()->route('products.index')
            ->with('success', 'Produit mis à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        $product->delete();
        
        return redirect()->route('products.index')
            ->with('success', 'Produit supprimé avec succès.');
    }
}
