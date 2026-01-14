# Arcana Architecture

## Overview
Arcana is a family digital library built as a **TypeScript Monorepo** following Clean Architecture principles.

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + shadcn/ui (100% native) |
| Backend | Node.js + Express + Prisma |
| Database | PostgreSQL |
| AI | Gemini 2.5 Flash (bulk scan), Gemini 2.5 Pro (reading cards) |
| Validation | Zod (shared schemas) |

## Monorepo Structure
```
arcana/
├── apps/
│   ├── web/           # React SPA (Vite)
│   └── api/           # Express REST API
├── packages/
│   └── shared/        # Zod schemas, types, constants
├── ARCHITECTURE.md
├── USER_STORIES.md
└── PRODUCT_MANIFESTO.md
```

## Backend: Clean Architecture
```
Controller (HTTP) → Service (Business Logic) → Repository (Prisma)
```

## White-Label Ready
All theming uses CSS custom properties in `:root`. **No hardcoded colors or custom CSS classes.**

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... shadcn/ui variables */
}
```

---

## AI Pipeline: Bulk Shelf Scan

### 1. Image Capture
User photographs entire bookshelf via mobile or desktop camera.

### 2. Gemini Flash - Bulk Detection
```
Prompt: "Analyse cette photo d'étagère. Identifie TOUS les livres visibles.
Pour chaque livre, extrais le titre et l'auteur.
Retourne un tableau JSON."
```
Returns: `[{ title, author, confidence }]`

### 3. Parallel Processing
For each detected book:
- Query Google Books API for validation + enrichment
- Calculate combined confidence score
- **Auto-insert if confidence ≥ 70%**
- Silently skip unreadable books (no blocking messages)

### 4. Duplicate Detection
- If book exists → increment `copyNumber`
- Display "Multiple Copy" badge

### 5. Anti-Spoiler Protection
- **Status ≠ READ**: Show only neutral Google Books data
- **Status = READ**: Generate premium reading card via Gemini Pro

---

## Database Schema

### Core Models
```prisma
model Book {
  id              String     @id
  title           String
  author          String
  coverUrl        String?
  categories      String[]   // From Google Books
  status          BookStatus // TO_READ | READING | READ
  owner           Owner      // ALIOU | SYLVIA | SACHA | LISA | FAMILY
  copyNumber      Int        // For duplicates
  loanedTo        String?    // Borrower name
  confidenceScore Float?     // From AI scan
}

model ReadingStatus {
  userId    String
  bookId    String
  status    BookStatus
  @@unique([userId, bookId])  // Per-user tracking
}

model User {
  id        String
  name      String
  birthDate DateTime
  isChild   Boolean
}
```

### Family Profiles (Seeded)
| Name | Birth Date | Role |
|------|-----------|------|
| Aliou | 05.05.1985 | Parent |
| Sylvia | 05.09.1986 | Parent |
| Sacha | 08.11.2016 | Child |
| Lisa | 31.10.2019 | Child |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/books/scan` | Bulk shelf scan (upload image) |
| GET | `/books` | List all books (with filters) |
| GET | `/books/filters` | Get filter options |
| GET | `/books/:id` | Get book details |
| PATCH | `/books/:id/status` | Update book status |
| POST | `/books/:id/reading-status` | Per-user reading status |
| PATCH | `/books/:id/loan` | Update loan status |
| GET | `/books/:id/reading-card` | Generate reading card (anti-spoiler) |
| GET | `/users` | Get family members |

---

## Frontend Components

### shadcn/ui Native (White-Label)
- Button, Card, Badge, Switch
- Tabs, Select, Checkbox, Separator
- Dialog, ScrollArea

### Custom Components
- `FilterSidebar` - Category/Status/Owner/Author filters
- `BookCard` - Book display with badges
- `ScannerModal` - Bulk scan interface with stats
- `Layout` - App shell with Kids Mode toggle
