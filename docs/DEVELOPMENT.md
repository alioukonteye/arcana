# Guide Développeur - Arcana

> Installation, configuration et conventions de développement

---

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Commandes Utiles](#commandes-utiles)
5. [Structure du Code](#structure-du-code)
6. [Conventions](#conventions)
7. [Workflow de Développement](#workflow-de-développement)
8. [Debugging](#debugging)
9. [Contribution](#contribution)

---

## Prérequis

| Outil | Version | Installation |
|-------|---------|--------------|
| **Node.js** | ≥ 20.0 | [nodejs.org](https://nodejs.org) |
| **pnpm** | ≥ 9.0 | `npm install -g pnpm` |
| **PostgreSQL** | ≥ 14 | [postgresql.org](https://postgresql.org) |

### Clés API requises

| Service | Obtention |
|---------|-----------|
| **Gemini API** | [ai.google.dev](https://ai.google.dev) |
| **Google Books API** | Gratuit, pas de clé requise |

---

## Installation

### 1. Cloner le repository

```bash
git clone https://github.com/alioukonteye/arcana.git
cd arcana
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configurer l'environnement

```bash
# Copier le template
cp .env.example .env

# Éditer avec vos valeurs
nano .env
```

**Contenu du `.env`:**

```bash
# Base de données PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/arcana"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key-here"

# Serveur (optionnel)
PORT=3000
```

### 4. Initialiser la base de données

```bash
cd apps/api

# Créer la base de données et appliquer les migrations
pnpm prisma migrate dev

# (Optionnel) Visualiser la DB avec Prisma Studio
pnpm prisma studio
```

### 5. Lancer le projet

```bash
# Depuis la racine du projet
cd ../..
pnpm dev
```

**URLs:**
- 🌐 Frontend: http://localhost:5173
- 🔌 API: http://localhost:3000
- 🗄️ Prisma Studio: http://localhost:5555 (si lancé)

---

## Configuration

### Variables d'environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `DATABASE_URL` | ✅ | URL de connexion PostgreSQL |
| `GEMINI_API_KEY` | ✅ | Clé API Google Gemini |
| `PORT` | ❌ | Port du serveur API (défaut: 3000) |

### Fichiers de configuration

| Fichier | Usage |
|---------|-------|
| `turbo.json` | Pipelines Turborepo |
| `pnpm-workspace.yaml` | Workspaces monorepo |
| `apps/web/vite.config.ts` | Build frontend |
| `apps/web/tailwind.config.js` | Thème CSS |
| `apps/api/tsconfig.json` | TypeScript backend |

---

## Commandes Utiles

### Depuis la racine (`/arcana`)

```bash
# Lancer tout en développement (frontend + API)
pnpm dev

# Build de production
pnpm build

# Linter
pnpm lint

# Formatter le code
pnpm format
```

### API (`/apps/api`)

```bash
# Développement avec hot-reload
pnpm dev

# Build TypeScript
pnpm build

# Lancer en production
pnpm start

# Prisma
pnpm prisma migrate dev     # Créer/appliquer migrations
pnpm prisma generate        # Régénérer le client
pnpm prisma studio          # Interface visuelle DB
pnpm prisma db push         # Push schema sans migration
```

### Frontend (`/apps/web`)

```bash
# Développement
pnpm dev

# Build production
pnpm build

# Preview du build
pnpm preview
```

---

## Structure du Code

### Backend (`apps/api/src`)

```
src/
├── index.ts              # Point d'entrée Express
├── controllers/          # Handlers HTTP
│   └── books.controller.ts
└── services/             # Logique métier
    ├── books.service.ts     # Orchestration
    ├── gemini.service.ts    # Intégration Gemini
    └── googlebooks.service.ts # Google Books API
```

**Pattern:** Controller → Service → External/DB

### Frontend (`apps/web/src`)

```
src/
├── main.tsx             # Entry point React
├── App.tsx              # Root component + Router
├── index.css            # Styles globaux + variables
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── Layout.tsx       # Layout avec header
│   ├── BookCard.tsx     # Carte livre
│   └── ScannerModal.tsx # Modal de scan
├── pages/
│   └── InventoryPage.tsx
├── features/
│   └── books/           # Feature-specific code
├── contexts/            # React contexts
└── lib/
    └── utils.ts         # Helpers (cn, etc.)
```

---

## Conventions

### Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Fichiers composants | PascalCase | `BookCard.tsx` |
| Fichiers services | kebab-case + suffix | `books.service.ts` |
| Fonctions | camelCase | `scanAndSave()` |
| Types/Interfaces | PascalCase | `interface BookStatus` |
| Constants | SCREAMING_SNAKE | `MAX_CONFIDENCE` |

### TypeScript

```typescript
// ✅ Bon: Types explicites pour les exports
export async function getBooks(): Promise<Book[]> { ... }

// ✅ Bon: Inférence pour les variables locales
const result = await prisma.book.findMany();

// ❌ Mauvais: any
function process(data: any) { ... }
```

### Imports

```typescript
// 1. External packages
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// 2. Internal packages
import { BookSchema } from '@arcana/shared';

// 3. Relative imports
import { BooksService } from '../services/books.service';
```

### CSS

> ⚠️ **Règle absolue**: Aucun CSS custom. Tout passe par shadcn/ui et les variables CSS.

```tsx
// ✅ Bon: Classes Tailwind via shadcn/ui
<Button variant="outline" size="sm">Click</Button>

// ❌ Mauvais: CSS inline ou custom classes
<button style={{ color: 'red' }}>Click</button>
<button className="my-custom-button">Click</button>
```

---

## Workflow de Développement

### Ajout d'une nouvelle feature

1. **Schéma DB** (si nécessaire)
   ```bash
   # Éditer apps/api/prisma/schema.prisma
   cd apps/api
   pnpm prisma migrate dev --name add_new_feature
   ```

2. **Service backend**
   ```bash
   # Créer apps/api/src/services/newfeature.service.ts
   ```

3. **Controller**
   ```bash
   # Ajouter routes dans apps/api/src/index.ts
   # Créer apps/api/src/controllers/newfeature.controller.ts
   ```

4. **Frontend**
   ```bash
   # Créer composants dans apps/web/src/components/
   # Créer page si nécessaire dans apps/web/src/pages/
   ```

5. **Documentation**
   ```bash
   # Mettre à jour docs/API.md avec nouveaux endpoints
   # Mettre à jour USER_STORIES.md si applicable
   ```

### Mise à jour de la documentation

Après chaque changement majeur, exécuter:

```bash
# Via workflow Gemini (recommandé)
/update-docs

# Ou manuellement
pnpm docs:update
```

---

## Debugging

### Logs API

```typescript
// Les erreurs sont loggées avec console.error
console.error('Scan Error:', error);
```

Voir les logs dans le terminal où `pnpm dev` tourne.

### Prisma Studio

```bash
cd apps/api
pnpm prisma studio
```

Ouvre une interface web pour explorer/éditer la DB.

### React DevTools

Installer l'extension browser pour inspecter les composants React.

### Problèmes courants

| Problème | Solution |
|----------|----------|
| `GEMINI_API_KEY is not configured` | Vérifier `.env` dans `apps/api/` |
| `Cannot find module '@prisma/client'` | `pnpm prisma generate` |
| Port 3000 déjà utilisé | Changer `PORT` dans `.env` |
| CORS error | Vérifier que l'API tourne bien |

---

## Contribution

### Git Flow

```bash
# Créer une branche feature
git checkout -b feature/my-feature

# Commits atomiques
git commit -m "feat: add loan tracking"

# Push et PR
git push origin feature/my-feature
```

### Format des commits

```
type(scope): description

feat:     Nouvelle fonctionnalité
fix:      Correction de bug
docs:     Documentation
refactor: Refactoring sans changement fonctionnel
test:     Ajout/modification de tests
chore:    Maintenance (deps, config...)
```

### Checklist avant PR

- [ ] Code formatté (`pnpm format`)
- [ ] Pas d'erreurs lint (`pnpm lint`)
- [ ] Build réussit (`pnpm build`)
- [ ] Documentation à jour
- [ ] Tests passent (quand implémentés)

---

## Liens utiles

- [📐 Documentation Technique](./TECHNICAL.md)
- [📋 Documentation Fonctionnelle](./FUNCTIONAL.md)
- [🔌 Référence API](./API.md)
