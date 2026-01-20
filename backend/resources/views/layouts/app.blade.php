<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Laravel App')</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
    
    <!-- Sidebar CSS -->
    <link href="{{ asset('css/sidebar.css') }}" rel="stylesheet">
    
    <!-- Styles supplémentaires -->
    @stack('styles')
</head>
<body>
    <!-- Sidebar -->
    <nav id="sidebar">
        <div class="sidebar-header">
            <h3 class="mb-0">
                <i class="bi bi-layout-text-sidebar"></i>
                <span class="ms-2">Mon App</span>
            </h3>
            <p class="text-muted mb-0 small mt-2">Gestion complète</p>
        </div>
        
        <div class="sidebar-menu">
            <ul>
                <!-- Gestion -->
                <li class="menu-title">Gestion</li>
                
                <li>
                    <a href="{{ route('categories.index') }}" 
                       class="{{ request()->is('categories*') ? 'active' : '' }}">
                        <i class="bi bi-folder"></i>
                        <span class="menu-text">Catégories</span>
                        @php
                            $categoryCount = \App\Models\Category::count();
                        @endphp
                        @if($categoryCount > 0)
                            <span class="sidebar-badge">{{ $categoryCount }}</span>
                        @endif
                    </a>
                </li>
                
                <li>
                    <a href="{{ route('products.index') }}" 
                       class="{{ request()->is('products*') ? 'active' : '' }}">
                        <i class="bi bi-folder"></i>
                        <span class="menu-text">Produits</span>
                        @php
                            $productCount = \App\Models\Product::count();
                        @endphp
                        @if($productCount > 0)
                            <span class="sidebar-badge">{{ $productCount }}</span>
                        @endif
                    </a>
                </li>
                
                
                
                <div class="menu-divider"></div>
                
                <!-- Administration -->
                
                <div class="menu-divider"></div>
                
                <!-- Divers -->
                <li>
                    <a href="{{ url('/aide') }}" 
                       class="{{ request()->is('aide*') ? 'active' : '' }}">
                        <i class="bi bi-question-circle"></i>
                        <span class="menu-text">Aide</span>
                    </a>
                </li>
                
                <li>
                    <a href="{{ url('/deconnexion') }}" 
                       onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                        <i class="bi bi-box-arrow-right"></i>
                        <span class="menu-text">Déconnexion</span>
                    </a>
                    <form id="logout-form" action="{{ url('/deconnexion') }}" method="POST" style="display: none;">
                        @csrf
                    </form>
                </li>
            </ul>
        </div>
        
        <!-- Version et copyright -->
        <div class="sidebar-footer">
            <div class="text-center small text-muted">
                <p class="mb-1">Version 1.0.0</p>
                <p class="mb-0">&copy; {{ date('Y') }} Mon App</p>
            </div>
        </div>
    </nav>
    
    <!-- Contenu principal -->
    <div id="content">
        <!-- Bouton toggle pour mobile -->
        <button type="button" id="sidebarCollapse" class="d-lg-none">
            <i class="bi bi-list"></i>
        </button>
        
        <!-- Barre de navigation supérieure -->
        <nav class="navbar navbar-expand-lg navbar-light navbar-top">
            <div class="container-fluid px-4">
                <div class="d-flex align-items-center">
                    <span class="navbar-text">
                        <i class="bi bi-calendar-check me-2"></i>
                        {{ now()->format('d/m/Y H:i') }}
                    </span>
                </div>
                
                <div class="d-flex align-items-center">
                    <!-- Profil utilisateur -->
                    <div class="dropdown">
                        <a href="#" class="d-flex align-items-center text-dark text-decoration-none dropdown-toggle" 
                           data-bs-toggle="dropdown">
                            <div class="user-avatar">
                                <i class="bi bi-person"></i>
                            </div>
                            <div class="ms-2 d-none d-md-block">
                                <div class="fw-bold">Admin</div>
                                <div class="small text-muted">Administrateur</div>
                            </div>
                        </a>
                        <div class="dropdown-menu dropdown-menu-end">
                            <a class="dropdown-item" href="{{ url('/profil') }}">
                                <i class="bi bi-person me-2"></i> Mon profil
                            </a>
                            <a class="dropdown-item" href="{{ url('/parametres') }}">
                                <i class="bi bi-gear me-2"></i> Paramètres
                            </a>
                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item" href="{{ url('/deconnexion') }}">
                                <i class="bi bi-box-arrow-right me-2"></i> Déconnexion
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Contenu principal DANS UN CONTAINER -->
        <main class="py-4">
            <div class="container-fluid px-4">
                <!-- Messages de session -->
                @if (session('success'))
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <i class="bi bi-check-circle me-2"></i>
                        {{ session('success') }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                @endif
                
                @if (session('error'))
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        {{ session('error') }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                @endif
                
                @if (session('warning'))
                    <div class="alert alert-warning alert-dismissible fade show" role="alert">
                        <i class="bi bi-exclamation-circle me-2"></i>
                        {{ session('warning') }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                @endif
                
                <!-- Header avec titre -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 class="mb-1 fw-bold">@yield('title')</h2>
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb mb-0">
                                <li class="breadcrumb-item"><a href="{{ url('/') }}" class="text-decoration-none">Accueil</a></li>
                                <li class="breadcrumb-item active">@yield('title')</li>
                            </ol>
                        </nav>
                    </div>
                    <div>
                        @yield('header-buttons')
                    </div>
                </div>
                
                <!-- Contenu principal -->
                <div class="row">
                    <div class="col-12">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body p-4">
                                @yield('content')
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Affichage des erreurs de validation -->
                @if ($errors->any())
                    <div class="alert alert-danger mt-4">
                        <h5 class="alert-heading">
                            <i class="bi bi-exclamation-triangle"></i> Veuillez corriger les erreurs suivantes :
                        </h5>
                        <ul class="mb-0">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif
            </div>
        </main>
        
        <!-- Pied de page -->
        <footer class="border-top py-3 mt-4">
            <div class="container-fluid px-4">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <span class="text-muted">
                            © {{ date('Y') }} Laravel CRUD - Tous droits réservés
                        </span>
                    </div>
                    <div class="col-md-6 text-end">
                        <span class="text-muted small">
                            <i class="bi bi-cpu me-1"></i> 
                            Mémoire: {{ number_format(memory_get_usage() / 1024 / 1024, 2) }} MB
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    </div>
    
    <!-- Scripts Bootstrap -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Scripts Sidebar -->
    <script>
        // Toggle sidebar sur mobile
        document.getElementById('sidebarCollapse').addEventListener('click', function() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('content').classList.toggle('active');
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-list');
            icon.classList.toggle('bi-x');
        });
        
        // Fermer la sidebar en cliquant à l'extérieur sur mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const content = document.getElementById('content');
                const toggleBtn = document.getElementById('sidebarCollapse');
                
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    content.classList.remove('active');
                    const icon = toggleBtn.querySelector('i');
                    icon.classList.remove('bi-x');
                    icon.classList.add('bi-list');
                }
            }
        });
        
        // Auto-hide alerts after 5 seconds
        setTimeout(function() {
            document.querySelectorAll('.alert').forEach(function(alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            });
        }, 5000);
        
        // Mettre à jour l'heure en temps réel
        function updateTime() {
            const now = new Date();
            const timeElement = document.querySelector('.navbar-text');
            if (timeElement) {
                const formattedTime = now.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                timeElement.innerHTML = `<i class="bi bi-calendar-check me-2"></i>${formattedTime}`;
            }
        }
        
        // Mettre à jour l'heure toutes les minutes
        setInterval(updateTime, 60000);
        
        // Exécuter au chargement
        document.addEventListener('DOMContentLoaded', function() {
            updateTime();
        });
    </script>
    
    <!-- Scripts supplémentaires -->
    @stack('scripts')
</body>
</html>