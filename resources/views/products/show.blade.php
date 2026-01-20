@extends('layouts.app')
@section('title', 'Détail du produit')
@section('content')
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Détail du produit</h1>
        <div>
            <a href="{{ route('products.edit', $product) }}" class="btn btn-warning">Modifier</a>
            <a href="{{ route('products.index') }}" class="btn btn-light">Retour</a>
        </div>
    </div>

    <div class="card">
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-bordered">
                        <tr>
                            <th style="width: 30%">ID</th>
                            <td>{{ $product->id }}</td>
                        </tr>
                        <tr>
                            <th>Nom</th>
                            <td>{{ $product->name }}</td>
                        </tr>
                        <tr>
                            <th>Slug</th>
                            <td>{{ $product->slug }}</td>
                        </tr>
                        <tr>
                            <th>Prix</th>
                            <td class="text-success fw-bold">{{ number_format($product->price, 2, ',', ' ') }} €</td>
                        </tr>
                        <tr>
                            <th>Catégorie</th>
                            <td>
                                <span class="badge bg-secondary">{{ $product->category->name }}</span>
                            </td>
                        </tr>
                        <tr>
                            <th>Date de création</th>
                            <td>{{ $product->created_at->format('d/m/Y H:i') }}</td>
                        </tr>
                        <tr>
                            <th>Dernière mise à jour</th>
                            <td>{{ $product->updated_at->format('d/m/Y H:i') }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="mt-4">
                <form action="{{ route('products.destroy', $product) }}" method="POST" class="d-inline"
                    onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer ce produit ?');">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn-danger">Supprimer</button>
                </form>
            </div>
        </div>
    </div>
@endsection