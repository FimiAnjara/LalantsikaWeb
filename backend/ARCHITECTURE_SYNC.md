# 🔄 Architecture de Synchronisation Universelle

## 📋 Principe Général

```
Requête → Controller → DatabaseSyncService → PostgreSQL (prioritaire) + Firebase (si disponible)
```

---

## 🎯 Les 3 Étapes Universelles

### **Étape 1 : PostgreSQL TOUJOURS EN PREMIER**
```php
$data['synchronized'] = false;
$record = Model::create($data); // Sauvegarde locale GARANTIE
```

### **Étape 2 : Tentative Firebase IMMÉDIATE**
```php
if ($firestore->isAvailable()) {
    $firestore->saveToCollection('nom_collection', $id, $data);
    $record->update(['synchronized' => true, 'last_sync_at' => now()]);
}
```

### **Étape 3 : Synchronisation différée (si Étape 2 échoue)**
```php
// Via background job ou endpoint manuel
DatabaseSyncService::syncUnsynchronized(Model::class, 'collection');
```

---

## 🛠️ Comment l'utiliser dans N'IMPORTE QUEL Controller

### Exemple 1 : Créer un Utilisateur
```php
use App\Services\DatabaseSyncService;

public function __construct(DatabaseSyncService $syncService)
{
    $this->syncService = $syncService;
}

public function store(Request $request)
{
    $user = $this->syncService->create(
        new User(),
        'utilisateurs', // Collection Firebase
        $request->validated()
    );
    
    return response()->json([
        'user' => $user,
        'synchronized' => $user->synchronized // true/false
    ]);
}
```

### Exemple 2 : Créer une Entreprise
```php
$entreprise = $this->syncService->create(
    new Entreprise(),
    'entreprises',
    $request->validated()
);
```

### Exemple 3 : Créer un Signalement
```php
$signalement = $this->syncService->create(
    new Signalement(),
    'signalements',
    $request->validated()
);
```

### Exemple 4 : Mettre à jour
```php
$this->syncService->update(
    $record,
    'collection_name',
    $newData
);
```

### Exemple 5 : Supprimer
```php
$this->syncService->delete($record, 'collection_name');
```

---

## 📊 Structure des Tables

**TOUTES les tables doivent avoir :**
```sql
ALTER TABLE nom_table ADD COLUMN synchronized BOOLEAN DEFAULT FALSE;
ALTER TABLE nom_table ADD COLUMN last_sync_at TIMESTAMP NULL;
```

**Migration fournie :** `2026_01_26_190000_add_sync_columns_to_all_tables.php`

---

## 🔍 Vérifier l'État de Synchronisation

### Endpoint global
```http
GET /api/sync/status
```

### Par modèle
```http
POST /api/sync/entreprises
POST /api/sync/signalements
```

---

## ✅ Avantages de cette Architecture

| Caractéristique | Bénéfice |
|----------------|----------|
| **PostgreSQL prioritaire** | Aucune perte de données même si Firebase est down |
| **Service unique** | Code réutilisable pour TOUS les modèles |
| **Méthodes universelles** | `saveToCollection()` fonctionne partout |
| **Sync différée** | Rattrapage automatique quand Firebase revient |
| **Tracking précis** | Colonnes `synchronized` + `last_sync_at` |

---

## 🚀 Flux Complet en Image

```
┌─────────────┐
│   Requête   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│   Controller    │
└──────┬──────────┘
       │
       ▼
┌──────────────────────┐
│ DatabaseSyncService  │
└──────┬───────────────┘
       │
       ├──────────────────┐
       ▼                  ▼
┌────────────┐    ┌─────────────┐
│ PostgreSQL │    │   Firebase  │
│ (TOUJOURS) │    │ (si dispo.) │
└────────────┘    └─────────────┘
       │                  │
       └─────────┬────────┘
                 ▼
        ┌──────────────┐
        │   Response   │
        │ synchronized │
        │  true/false  │
        └──────────────┘
```

---

## 📝 Checklist d'Implémentation

Pour ajouter la sync à une nouvelle table :

- [ ] Créer le modèle avec `$fillable` incluant `synchronized` et `last_sync_at`
- [ ] Ajouter les colonnes via migration (ou utiliser la migration universelle)
- [ ] Dans le controller, injecter `DatabaseSyncService`
- [ ] Utiliser `create()`, `update()`, `delete()` du service
- [ ] Tester avec Firebase ON et OFF
- [ ] Vérifier le statut `synchronized` dans la réponse

---

## 🎓 Résumé en 3 Lignes

1. **PostgreSQL = Base principale** (toujours écrit en premier)
2. **Firebase = Copie cloud** (sync si disponible)
3. **Service universel** (même code pour toutes les tables)

**C'est tout ! Simple, robuste, et extensible à l'infini.**
