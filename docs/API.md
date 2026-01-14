# Référence API - Arcana

> Documentation complète des endpoints REST

---

## 📋 Table des Matières

1. [Informations Générales](#informations-générales)
2. [Authentification](#authentification)
3. [Endpoints](#endpoints)
4. [Codes d'Erreur](#codes-derreur)
5. [Exemples](#exemples)

---

## Informations Générales

### Base URL

| Environnement | URL |
|---------------|-----|
| Développement | `http://localhost:3000` |
| Production | `https://api.arcana.app` (à venir) |

### Format des réponses

Toutes les réponses suivent ce format standard:

```typescript
// Succès
{
  "success": true,
  "data": { ... },
  "message"?: string
}

// Erreur
{
  "success": false,
  "error": string,
  "details"?: string
}
```

### Headers requis

```http
Content-Type: application/json
```

Pour les uploads de fichiers:
```http
Content-Type: multipart/form-data
```

---

## Authentification

> ⚠️ **Note**: L'authentification n'est pas encore implémentée dans le MVP. Tous les endpoints sont actuellement publics.

---

## Endpoints

<!-- AUTO-GEN:API-ROUTES START -->

### Health Check

#### `GET /`

Vérifie que l'API est opérationnelle.

**Réponse:**

```json
{
  "message": "Arcana API",
  "version": "2.0.0",
  "features": ["bulk-shelf-scan", "family-profiles", "anti-spoiler"]
}
```

---

### Books

#### `POST /books/scan`

**Bulk Shelf Scan** - Scanne une photo d'étagère et identifie TOUS les livres visibles.

**Headers:**
```http
Content-Type: multipart/form-data
```

**Body:**

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `image` | File | ✅ | Image JPEG/PNG de l'étagère complète |

**Réponse succès (200):**

```json
{
  "success": true,
  "message": "8 livre(s) ajouté(s) à votre bibliothèque",
  "stats": {
    "detected": 12,
    "added": 8,
    "duplicates": 2,
    "skipped": 2
  },
  "books": [
    {
      "id": "uuid-xxx",
      "title": "Le Petit Prince",
      "author": "Antoine de Saint-Exupéry",
      "coverUrl": "https://books.google.com/...",
      "confidence": 0.95,
      "isNewBook": true
    }
  ]
}
```

> ⚠️ **Seuil de confiance**: 70% (auto-insert sans message bloquant)

---

#### `GET /books`

Récupère tous les livres de l'inventaire avec filtres optionnels.

**Query Parameters:**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `status` | string | Filtrer par statut: `TO_READ`, `READING`, `READ` |
| `owner` | string | Filtrer par propriétaire: `ALIOU`, `SYLVIA`, `SACHA`, `LISA`, `FAMILY` |
| `category` | string | Filtrer par catégorie Google Books |
| `search` | string | Recherche textuelle (titre, auteur) |

**Réponse succès (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-xxx",
      "isbn": "978-2-07-040850-4",
      "title": "Le Petit Prince",
      "author": "Antoine de Saint-Exupéry",
      "coverUrl": "https://books.google.com/...",
      "categories": ["Fiction", "Jeunesse"],
      "status": "TO_READ",
      "owner": "FAMILY",
      "loanedTo": null,
      "copyNumber": 1,
      "readingStatuses": [
        { "userId": "xxx", "status": "READ" }
      ]
    }
  ]
}
```

---

#### `GET /books/filters`

Récupère les options de filtrage disponibles (catégories, auteurs).

**Réponse succès (200):**

```json
{
  "success": true,
  "data": {
    "categories": ["Fiction", "Jeunesse", "Science-Fiction"],
    "authors": ["Antoine de Saint-Exupéry", "J.K. Rowling"],
    "owners": ["ALIOU", "SYLVIA", "SACHA", "LISA", "FAMILY"]
  }
}
```

---

#### `GET /books/:id`

Récupère les détails d'un livre spécifique avec prêts et statuts de lecture.

**Paramètres URL:**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Identifiant unique du livre |

**Réponse succès (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid-xxx",
    "title": "Le Petit Prince",
    "author": "Antoine de Saint-Exupéry",
    "status": "TO_READ",
    "owner": "FAMILY",
    "loanedTo": "Marie",
    "readingStatuses": [
      { "user": { "name": "Aliou" }, "status": "READ" },
      { "user": { "name": "Sacha" }, "status": "READING" }
    ],
    "loans": [...]
  }
}
```

---

#### `PATCH /books/:id/status`

Met à jour le statut global de lecture d'un livre.

**Body:**

```json
{
  "status": "READING"
}
```

| Valeur | Description |
|--------|-------------|
| `TO_READ` | À lire |
| `READING` | En cours de lecture |
| `READ` | Lu |

---

#### `POST /books/:id/reading-status`

Met à jour le statut de lecture **par utilisateur** (US5).

**Body:**

```json
{
  "userId": "user-uuid",
  "status": "READ"
}
```

**Réponse succès (200):**

```json
{
  "success": true,
  "data": {
    "id": "reading-status-uuid",
    "userId": "user-uuid",
    "bookId": "book-uuid",
    "status": "READ"
  }
}
```

---

#### `PATCH /books/:id/loan`

Met à jour le statut de prêt d'un livre (US3).

**Body - Prêter:**

```json
{
  "loanedTo": "Marie"
}
```

**Body - Retour:**

```json
{
  "loanedTo": null
}
```

---

#### `GET /books/:id/reading-card`

Récupère la carte de lecture IA (résumé, thèmes, questions) - **Protégé Anti-Spoiler**.

> ⚠️ **Règle Anti-Spoiler**: Retourne 403 si le livre n'est pas marqué READ pour l'utilisateur.

**Query Parameters:**

| Paramètre | Type | Description |
|-----------|------|-------------|
| `userId` | UUID | ID de l'utilisateur demandant la carte |

**Réponse succès (200):**

```json
{
  "success": true,
  "data": {
    "summary": "Le Petit Prince raconte l'histoire...",
    "themes": ["Amitié", "Enfance", "Voyage"],
    "discussionQuestions": [
      "Pourquoi le renard demande-t-il à être apprivoisé?",
      "Que représente la rose pour le Petit Prince?"
    ],
    "readingLevel": "7-10 ans",
    "estimatedReadingTime": "2-3 heures"
  }
}
```

**Réponse erreur (403 - Anti-Spoiler):**

```json
{
  "success": false,
  "error": "Anti-spoiler protection",
  "message": "Vous devez d'abord lire ce livre pour accéder à la carte de lecture"
}
```

---

### Users

#### `GET /users`

Récupère tous les membres de la famille.

**Réponse succès (200):**

```json
{
  "success": true,
  "data": [
    { "id": "uuid-1", "name": "Aliou", "isChild": false, "birthDate": "1985-05-05" },
    { "id": "uuid-2", "name": "Sylvia", "isChild": false, "birthDate": "1986-09-05" },
    { "id": "uuid-3", "name": "Sacha", "isChild": true, "birthDate": "2016-11-08" },
    { "id": "uuid-4", "name": "Lisa", "isChild": true, "birthDate": "2019-10-31" }
  ]
}
```

<!-- AUTO-GEN:API-ROUTES END -->

---

## Codes d'Erreur

| Code | Signification | Cause typique |
|------|---------------|---------------|
| `200` | OK | Requête traitée avec succès |
| `400` | Bad Request | Paramètres manquants ou invalides |
| `404` | Not Found | Ressource inexistante |
| `500` | Internal Server Error | Erreur serveur (Gemini, DB...) |

---

## Exemples

### cURL

#### Scanner un livre

```bash
curl -X POST http://localhost:3000/books/scan \
  -F "image=@/path/to/shelf-photo.jpg"
```

#### Lister tous les livres

```bash
curl http://localhost:3000/books
```

#### Mettre à jour un statut

```bash
curl -X PATCH http://localhost:3000/books/uuid-xxx/status \
  -H "Content-Type: application/json" \
  -d '{"status": "READ"}'
```

### JavaScript (fetch)

```javascript
// Scanner une image
const formData = new FormData();
formData.append('image', file);

const response = await fetch('http://localhost:3000/books/scan', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.books);
```

### TypeScript (avec types)

```typescript
interface Book {
  id: string;
  title: string;
  author: string;
  status: 'TO_READ' | 'READING' | 'READ';
  owner: 'ALIOU' | 'SYLVIA' | 'SACHA' | 'LISA' | 'FAMILY';
  coverUrl?: string;
  copyNumber: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function getBooks(): Promise<Book[]> {
  const res = await fetch('http://localhost:3000/books');
  const json: ApiResponse<Book[]> = await res.json();

  if (!json.success) throw new Error(json.error);
  return json.data!;
}
```

---

## Liens utiles

- [📐 Documentation Technique](./TECHNICAL.md)
- [📋 Documentation Fonctionnelle](./FUNCTIONAL.md)
- [💻 Guide Développeur](./DEVELOPMENT.md)
