# Documentation Technique - Arcana

> Architecture, stack technologique et patterns de développement

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack Technologique](#stack-technologique)
3. [Architecture Monorepo](#architecture-monorepo)
4. [Backend - Clean Architecture](#backend---clean-architecture)
5. [Frontend - Structure React](#frontend---structure-react)
6. [Base de Données](#base-de-données)
7. [Pipeline IA](#pipeline-ia)
8. [Configuration](#configuration)

---

## Vue d'ensemble

Arcana est construit comme un **TypeScript Monorepo** suivant les principes de Clean Architecture. L'application sépare clairement les responsabilités entre le frontend (React SPA) et le backend (API REST).

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[UI Components]
        Pages[Pages]
        Hooks[Custom Hooks]
    end

    subgraph "Backend (Express)"
        Controllers[Controllers]
        Services[Services]
        Repositories[Prisma Client]
    end

    subgraph "External"
        Gemini[Gemini AI]
        GoogleBooks[Google Books API]
        DB[(PostgreSQL)]
    end

    UI --> Pages
    Pages --> Hooks
    Hooks -->|HTTP| Controllers
    Controllers --> Services
    Services --> Repositories
    Services --> Gemini
    Services --> GoogleBooks
    Repositories --> DB
```

---

## Stack Technologique

### Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 18.2 | Framework UI |
| Vite | 5.2 | Build tool & dev server |
| TypeScript | 5.4 | Typage statique |
| shadcn/ui | - | Composants UI (Radix-based) |
| TailwindCSS | 3.4 | Styling utility-first |
| Framer Motion | 12.x | Animations fluides |
| TanStack Query | 5.x | Data fetching & cache |
| React Router | 7.x | Routage SPA |

### Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| Node.js | 20+ | Runtime |
| Express | 4.19 | Framework HTTP |
| Prisma | 5.13 | ORM & migrations |
| Zod | 3.23 | Validation de schémas |
| Multer | 2.0 | Upload de fichiers |

### Services Externes

| Service | Usage |
|---------|-------|
| **Gemini 2.5 Flash** | Identification visuelle des livres |
| **Google Books API** | Validation croisée & enrichissement métadonnées |
| **PostgreSQL** | Base de données relationnelle |

### Outillage

| Outil | Rôle |
|-------|------|
| Turborepo | Orchestration monorepo |
| pnpm | Package manager (workspaces) |
| Prettier | Formatage du code |
| nodemon | Hot reload backend |

---

## Architecture Monorepo

```
arcana/
├── apps/
│   ├── web/                    # 🌐 Frontend React
│   │   ├── src/
│   │   │   ├── components/     # Composants réutilisables
│   │   │   │   ├── ui/         # shadcn/ui components
│   │   │   │   ├── BookCard.tsx
│   │   │   │   ├── Layout.tsx
│   │   │   │   └── ScannerModal.tsx
│   │   │   ├── pages/          # Pages/routes
│   │   │   │   └── InventoryPage.tsx
│   │   │   ├── features/       # Feature modules
│   │   │   │   └── books/
│   │   │   ├── contexts/       # React contexts
│   │   │   ├── lib/            # Utilities
│   │   │   ├── App.tsx         # Root component
│   │   │   └── main.tsx        # Entry point
│   │   ├── index.html
│   │   └── package.json
│   │
│   └── api/                    # 🔌 Backend Express
│       ├── src/
│       │   ├── controllers/    # Route handlers
│       │   │   └── books.controller.ts
│       │   ├── services/       # Business logic
│       │   │   ├── books.service.ts
│       │   │   ├── gemini.service.ts
│       │   │   └── googlebooks.service.ts
│       │   └── index.ts        # Server entry
│       ├── prisma/
│       │   ├── schema.prisma   # Database schema
│       │   └── migrations/     # Migration history
│       └── package.json
│
├── packages/
│   └── shared/                 # 📦 Code partagé
│       └── src/
│           └── index.ts        # Types & schemas Zod
│
├── docs/                       # 📖 Documentation
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # Workspace definition
└── package.json                # Root scripts
```

### Dépendances entre packages

```mermaid
graph LR
    Web[apps/web] --> Shared[packages/shared]
    API[apps/api] --> Shared
    Web -.->|HTTP| API
```

---

## Backend - Clean Architecture

Le backend suit un pattern **Controller → Service → Repository** pour une séparation claire des responsabilités.

### Flux de données

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────┐
│                  CONTROLLER                          │
│  • Valide la requête HTTP                           │
│  • Extrait les paramètres                           │
│  • Retourne la réponse HTTP                         │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                   SERVICE                            │
│  • Logique métier                                   │
│  • Orchestration des appels                         │
│  • Règles de validation (confiance ≥ 90%)          │
└────────────────────────┬────────────────────────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
       ┌────────┐   ┌────────┐   ┌────────┐
       │ Prisma │   │ Gemini │   │ Google │
       │ Client │   │   AI   │   │ Books  │
       └────────┘   └────────┘   └────────┘
```

### Services principaux

#### GeminiService
```typescript
// Identification visuelle des livres
async identifyBook(imagePath: string): Promise<ScannedBook>
```
- Encode l'image en base64
- Appelle Gemini 2.5 Flash avec prompt structuré
- Retourne: `{ title, author, confidence }`

#### GoogleBooksService
```typescript
// Validation croisée et enrichissement
async validateAndEnrich(title: string, author: string): Promise<ValidationResult>
```
- Recherche dans l'API Google Books
- Calcule un score de confiance
- Enrichit avec: couverture, ISBN, description, éditeur

#### BooksService
```typescript
// Orchestration du scan complet
async scanAndSave(imagePath: string): Promise<ScanResult>
```
- Coordonne Gemini + Google Books
- Applique règle des 90% de confiance
- Gère les doublons (incrémente `copyNumber`)

---

## Frontend - Structure React

### Architecture des composants

```
App.tsx
├── Layout.tsx              # Header + Navigation
│   └── ThemeContext        # Mode clair/sombre
│
└── Routes
    └── InventoryPage.tsx   # Page principale
        ├── ScannerModal.tsx  # Modal de scan
        └── BookCard.tsx      # Carte de livre
            └── ui/Button, Card, Badge...
```

### Patterns utilisés

| Pattern | Usage |
|---------|-------|
| **Feature Folders** | Organisation par domaine (`features/books/`) |
| **Compound Components** | shadcn/ui (Card.Header, Card.Content...) |
| **Custom Hooks** | Abstraction de la logique (TanStack Query) |
| **Context API** | État global (thème, utilisateur) |

### Design System

Arcana utilise **shadcn/ui** avec des variables CSS personnalisables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  /* ... autres tokens */
}
```

> ⚠️ **Règle**: Aucun CSS custom. Tout passe par les variables et classes shadcn/ui.

---

## Base de Données

### Schéma Prisma

<!-- AUTO-GEN:PRISMA-SCHEMA START -->

```prisma
enum BookStatus {
  TO_READ
  READING
  READ
  WISHLIST
}

enum Owner {
  ALIOU
  SYLVIA
  SACHA
  LISA
  FAMILY
}

model User {
  id        String   @id @default(uuid())
  clerkId   String?  @unique
  email     String?  @unique
  name      String   @unique
  isChild   Boolean  @default(false)
  birthDate DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  loans           Loan[]
  books           Book[]          @relation("AddedBy")
  readingStatuses ReadingStatus[]
}

model Book {
  id              String     @id @default(uuid())
  isbn            String?
  title           String
  author          String
  coverUrl        String?
  description     String?
  publisher       String?
  publishedDate   String?
  pageCount       Int?
  categories      String[]   @default([])

  // Scan metadata
  confidenceScore Float?     // 0-1 from Gemini
  googleBooksId   String?    // For cross-validation
  aiAnalysis      Json?      // AI-generated reading card (analysis, themes, questions)

  // Inventory
  status          BookStatus @default(TO_READ)
  owner           Owner      @default(FAMILY)
  copyNumber      Int        @default(1)  // For multiple copies

  // Loan tracking (simple)
  loanedTo        String?    // Borrower name when book is out
  loanDate        DateTime?  // Date when the book was lent

  // Relations
  addedById       String?
  addedBy         User?      @relation("AddedBy", fields: [addedById], references: [id])

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  loans           Loan[]
  readingStatuses ReadingStatus[]

  @@index([title, author])
  @@index([owner])
  @@index([status])
}

model Loan {
  id           String    @id @default(uuid())
  bookId       String
  book         Book      @relation(fields: [bookId], references: [id])

  borrowerName String

  lentById     String?
  lentBy       User?     @relation(fields: [lentById], references: [id])

  lentAt       DateTime  @default(now())
  returnedAt   DateTime?

  @@index([bookId])
}

// Per-user reading status tracking (who read what)
model ReadingStatus {
  id        String     @id @default(uuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  bookId    String
  book      Book       @relation(fields: [bookId], references: [id])
  status    BookStatus @default(TO_READ)

  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@unique([userId, bookId])
  @@index([userId])
  @@index([bookId])
}
```

<!-- AUTO-GEN:PRISMA-SCHEMA END -->

### Diagramme Entité-Relation

```mermaid
erDiagram
    User ||--o{ Book : "added"
    User ||--o{ Loan : "lent"
    User ||--o{ ReadingStatus : "tracks"
    Book ||--o{ Loan : "has"
    Book ||--o{ ReadingStatus : "tracked_by"

    User {
        uuid id PK
        string name UK
        boolean isChild
        datetime birthDate
    }

    Book {
        uuid id PK
        string title
        string author
        string isbn
        string[] categories
        float confidenceScore
        enum status
        enum owner
        string loanedTo
        int copyNumber
    }

    ReadingStatus {
        uuid id PK
        uuid userId FK
        uuid bookId FK
        enum status
    }

    Loan {
        uuid id PK
        string borrowerName
        datetime lentAt
        datetime returnedAt
    }
```

---

## Pipeline IA

### Magic Shelf Scan (Bulk Detection)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Gemini
    participant GoogleBooks
    participant DB

    User->>Frontend: Upload photo étagère complète
    Frontend->>API: POST /books/scan (image)
    API->>Gemini: Identify ALL books (base64)
    Gemini-->>API: [{title, author, confidence}, ...]

    loop Pour chaque livre détecté
        API->>GoogleBooks: Search(title, author)
        GoogleBooks-->>API: Metadata + HD cover
        API->>API: Calculate final confidence

        alt confidence >= 70%
            API->>DB: Check duplicate
            alt exists
                API->>DB: Increment copyNumber
            else new
                API->>DB: Create book
            end
        else confidence < 70%
            API->>API: Skip silently
        end
    end

    API-->>Frontend: {stats, books[]}
    Frontend-->>User: Display scan results
```

### Règles métier

| Règle | Condition | Action |
|-------|-----------|--------|
| Auto-insert | `confidence ≥ 0.70` | Ajout automatique en DB (silencieux) |
| Duplicate | Titre + Auteur existants | Incrémente `copyNumber`, badge "Copie multiple" |
| Low confidence | `confidence < 0.70` | Skip silencieux (pas de warning) |
| Anti-Spoiler | User demande reading-card | 403 si status != READ |

---

## Configuration

### Variables d'environnement

Créer un fichier `.env` à partir de `.env.example`:

```bash
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/arcana"

# API Keys
GEMINI_API_KEY="your-gemini-api-key"

# Server
PORT=3000
```

### Fichiers de configuration

| Fichier | Rôle |
|---------|------|
| `turbo.json` | Pipelines Turborepo (build, dev, lint) |
| `pnpm-workspace.yaml` | Définition des workspaces |
| `apps/web/vite.config.ts` | Configuration Vite |
| `apps/web/tailwind.config.js` | Thème TailwindCSS |
| `apps/api/tsconfig.json` | Configuration TypeScript backend |
| `apps/api/prisma/schema.prisma` | Schéma base de données |

---

## Liens utiles

- [📋 Documentation Fonctionnelle](./FUNCTIONAL.md)
- [🔌 Référence API](./API.md)
- [💻 Guide Développeur](./DEVELOPMENT.md)
