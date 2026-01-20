@extends('layouts.app')
@section('title', 'Produits')
@section('content')
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Produits</h1>
        <a href="{{ route('products.create') }}" class="btn btn-primary">
            <i class="bi bi-plus-circle me-1"></i> Nouveau produit
        </a>
    </div>

    <!-- Barre de recherche et filtres -->
    <div class="card mb-4">
        <div class="card-body">
            <form action="{{ route('products.index') }}" method="GET" class="row g-3">
                <div class="col-md-4">
                    <input type="text" name="search" class="form-control"
                        placeholder="Rechercher un produit..." value="{{ request('search') }}">
                </div>
                <div class="col-md-4">
                    <select name="category_id" class="form-select">
                        <option value="">Toutes les catégories</option>
                        @foreach($categories as $category)
                            <option value="{{ $category->id }}" 
                                {{ request('category_id') == $category->id ? 'selected' : '' }}>
                                {{ $category->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-3">
                    <select name="sort" class="form-select">
                        <option value="asc" {{ $sort == 'asc' ? 'selected' : '' }}>Prix croissant</option>
                        <option value="desc" {{ $sort == 'desc' ? 'selected' : '' }}>Prix décroissant</option>
                    </select>
                </div>
                <div class="col-md-1">
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="bi bi-funnel"></i>
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Tableau des produits -->
    @if ($products->count() > 0)
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Prix</th>
                    <th>Catégorie</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($products as $product)
                    <tr>
                        <td>{{ $product->id }}</td>
                        <td>{{ $product->name }}</td>
                        <td>{{ number_format($product->price, 2, ',', ' ') }} €</td>
                        <td>{{ $product->category->name }}</td>
                        <td>
                            <a href="{{ route('products.show', $product) }}" class="btn btn-sm btn-info">Voir</a>
                            <a href="{{ route('products.edit', $product) }}" class="btn btn-sm btn-warning">Modifier</a>
                            <form action="{{ route('products.destroy', $product) }}" method="POST" class="d-inline">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-sm btn-danger"
                                    onclick="return confirm('Êtes-vous sûr de vouloir supprimer ce produit ?');">Supprimer</button>
                            </form>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center">
            <div class="text-muted">
                Affichage de {{ $products->firstItem() }} à {{ $products->lastItem() }} sur
                {{ $products->total() }} produits
            </div>
            {{ $products->appends(request()->query())->links('pagination::bootstrap-5') }}
        </div>
    @else
        <div class="alert alert-info">
            @if (request('search') || request('category_id'))
                Aucun produit trouvé pour vos critères de recherche.
                <a href="{{ route('products.index') }}" class="alert-link">Afficher tous les produits</a>
            @else
                Aucun produit disponible. <a href="{{ route('products.create') }}" class="alert-link">Créer un produit</a>
            @endif
        </div>
    @endif

    <!-- Statistiques -->
    @if($productsByCategory->count() > 0)
    <div class="card mt-4">
        <div class="card-header">
            <h5 class="mb-0">Produits par catégorie</h5>
        </div>
        <div class="card-body">
            <div class="row">
                @foreach($productsByCategory as $category)
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="card-title">{{ $category->name }}</h6>
                                <p class="card-text">
                                    <span class="badge bg-primary">{{ $category->products_count }} produit(s)</span>
                                </p>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>
    @endif
@endsection