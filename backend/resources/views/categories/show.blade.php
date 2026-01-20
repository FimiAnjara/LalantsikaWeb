@extends('layouts.app')
@section('title', 'Détail de la catégorie')
@section('content')
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Détail de la catégorie</h1>
        <div>
            <a href="{{ route('categories.edit', $category) }}" class="btn btn-warning">Modifier</a>
            <a href="{{ route('categories.index') }}" class="btn btn-light">Retour</a>
        </div>
    </div>

    <div class="card">
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <table class="table table-bordered">
                        <tr>
                            <th style="width: 30%">ID</th>
                            <td>{{ $category->id }}</td>
                        </tr>
                        <tr>
                            <th>Nom</th>
                            <td>{{ $category->name }}</td>
                        </tr>
                        <tr>
                            <th>Slug</th>
                            <td>{{ $category->slug }}</td>
                        </tr>
                        <tr>
                            <th>Description</th>
                            <td>{{ $category->description ?: 'Aucune description' }}</td>
                        </tr>
                        <tr>
                            <th>Statut</th>
                            <td>
                                @if ($category->is_active)
                                    <span class="badge bg-success">Actif</span>
                                @else
                                    <span class="badge bg-secondary">Inactif</span>
                                @endif
                            </td>
                        </tr>
                        <tr>
                            <th>Date de création</th>
                            <td>{{ $category->created_at->format('d/m/Y H:i') }}</td>
                        </tr>
                        <tr>
                            <th>Dernière mise à jour</th>
                            <td>{{ $category->updated_at->format('d/m/Y H:i') }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="mt-4">
                <form action="{{ route('categories.destroy', $category) }}" method="POST" class="d-inline"
                    onsubmit="return confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?');">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="btn btn-danger">Supprimer</button>
                </form>
            </div>
        </div>
    </div>
@endsection