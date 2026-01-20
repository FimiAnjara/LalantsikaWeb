<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categories</title>
</head>
<body>
    <h1>Liste des categories</h1>
    <ul>
        @foreach ($categories as $category)
            <li>{{ $category->name }} - {{ $category->description }} - Actif: {{ $category->is_active ? 'Oui' : 'Non' }}</li>
        @endforeach
    </ul>
</body>
</html>