@extends('layouts.app')
@section('title', 'Catégories')
@section('content')
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Catégories</h1>
        <a href="{{ route('categories.create') }}" class="btn btn-primary">
            <i class="bi bi-plus-circle me-1"></i> Nouvelle catégorie
        </a>
    </div>

    <!-- Barre de recherche -->
    <div class="card mb-4">
        <div class="card-body">
            <form action="{{ route('categories.index') }}" method="GET" class="row g-3">
                <div class="col-md-5">
                    <input type="text" name="search" class="form-control"
                        placeholder="Rechercher par nom ou description..." value="{{ request('search') }}">
                </div>
                <div class="col-md-4">
                    <select name="status" class="form-select">
                        <option value="">Tous les statuts</option>
                        <option value="1" {{ request('status') == '1' ? 'selected' : '' }}>Actif</option>
                        <option value="0" {{ request('status') == '0' ? 'selected' : '' }}>Inactif</option>
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

    <!-- Tableau des catégories -->
    @if ($categories->count() > 0)
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($categories as $category)
                    <tr>
                        <td>{{ $category->id }}</td>
                        <td>{{ $category->name }}</td>
                        <td>{{ Str::limit($category->description, 50) }}</td>
                        <td>
                            @if ($category->is_active)
                                <span class="badge bg-success">Actif</span>
                            @else
                                <span class="badge bg-secondary">Inactif</span>
                            @endif
                        </td>
                        <td>
                        <td>
                            <a href="{{ route('categories.show', $category) }}" class="btn btn-sm btn-info">Voir</a>
                            <a href="{{ route('categories.edit', $category) }}" class="btn btn-sm btn-warning">Modifier</a>
                            <form action="{{ route('categories.destroy', $category) }}" method="POST" class="d-inline">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-sm btn-danger"
                                    onclick="return confirm('Êtes-vous sûr ?')">Supprimer</button>
                            </form>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center">
            <div class="text-muted">
                Affichage de {{ $categories->firstItem() }} à {{ $categories->lastItem() }} sur
                {{ $categories->total() }} catégories
            </div>
            {{ $categories->appends(['search' => request('search')])->links('pagination::bootstrap-5') }}
        </div>
    @else
        <div class="alert alert-info">
            @if (request('search'))
                Aucune catégorie trouvée pour "{{ request('search') }}".
                <a href="{{ route('categories.index') }}" class="alert-link">Afficher toutes les catégories</a>
            @else
                Aucune catégorie disponible. <a href="{{ route('categories.create') }}" class="alert-link">Créer une
                    catégorie</a>
            @endif
        </div>
    @endif
@endsection
