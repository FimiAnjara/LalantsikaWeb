@extends('layouts.app')
@section('title', 'Modifier la catégorie')
@section('content')
    <div class="card">
        <div class="card-header">
            <h2>Modifier : {{ $category->name }}</h2>
        </div>
        <div class="card-body">
            <form action="{{ route('categories.update', $category) }}" method="POST">
                @csrf
                @method('PUT')
                
                <div class="mb-3">
                    <label for="name" class="form-label">Nom *</label>
                    <input type="text" class="form-control @error('name') is-invalid @enderror" 
                           id="name" name="name" value="{{ old('name', $category->name) }}" required>
                    @error('name')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label for="slug" class="form-label">Slug</label>
                    <input type="text" class="form-control @error('slug') is-invalid @enderror" 
                           id="slug" name="slug" value="{{ old('slug', $category->slug) }}">
                    @error('slug')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label for="description" class="form-label">Description</label>
                    <textarea class="form-control @error('description') is-invalid @enderror" 
                              id="description" name="description" rows="3">{{ old('description', $category->description) }}</textarea>
                    @error('description')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <!-- Radio pour is_active -->
                <div class="mb-4">
                    <label class="form-label d-block">Statut *</label>
                    
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="is_active" 
                               id="is_active_yes" value="1" 
                               {{ old('is_active', $category->is_active) == 1 ? 'checked' : '' }}>
                        <label class="form-check-label" for="is_active_yes">
                            <span class="badge bg-success">Actif</span>
                        </label>
                    </div>
                    
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="is_active" 
                               id="is_active_no" value="0"
                               {{ old('is_active', $category->is_active) == 0 ? 'checked' : '' }}>
                        <label class="form-check-label" for="is_active_no">
                            <span class="badge bg-secondary">Inactif</span>
                        </label>
                    </div>
                    
                    @error('is_active')
                        <div class="text-danger mt-1">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mt-4">
                    <button type="submit" class="btn btn-primary">Mettre à jour</button>
                    <a href="{{ route('categories.index') }}" class="btn btn-secondary">Annuler</a>
                </div>
            </form>
        </div>
    </div>
@endsection