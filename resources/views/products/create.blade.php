@extends('layouts.app')
@section('title', 'Nouveau produit')
@section('content')
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Créer un produit</h1>
        <a href="{{ route('products.index') }}" class="btn btn-light">Retour</a>
    </div>

    <div class="card">
        <div class="card-body">
            <form action="{{ route('products.store') }}" method="POST">
                @csrf
                
                <div class="mb-3">
                    <label for="name" class="form-label">Nom du produit <span class="text-danger">*</span></label>
                    <input type="text" 
                           name="name" 
                           id="name" 
                           class="form-control @error('name') is-invalid @enderror" 
                           value="{{ old('name') }}"
                           required>
                    @error('name')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                    <div class="form-text">Le nom doit être unique</div>
                </div>
                
                <div class="mb-3">
                    <label for="price" class="form-label">Prix <span class="text-danger">*</span></label>
                    <input type="number" 
                           name="price" 
                           id="price" 
                           step="0.01" 
                           min="0"
                           class="form-control @error('price') is-invalid @enderror" 
                           value="{{ old('price') }}"
                           required>
                    @error('price')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                    <div class="form-text">Le prix doit être positif</div>
                </div>
                
                <div class="mb-3">
                    <label for="category_id" class="form-label">Catégorie <span class="text-danger">*</span></label>
                    <select name="category_id" 
                            id="category_id" 
                            class="form-control @error('category_id') is-invalid @enderror"
                            required>
                        <option value="">Sélectionnez une catégorie</option>
                        @foreach($categories as $category)
                            <option value="{{ $category->id }}" 
                                {{ old('category_id') == $category->id ? 'selected' : '' }}>
                                {{ $category->name }}
                            </option>
                        @endforeach
                    </select>
                    @error('category_id')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>
                
                <div class="mt-4">
                    <button type="submit" class="btn btn-primary">Créer le produit</button>
                    <a href="{{ route('products.index') }}" class="btn btn-secondary">Annuler</a>
                </div>
            </form>
        </div>
    </div>
@endsection