# Arcana 📚✨

> **Le foyer numérique familial** - Une application de gestion de bibliothèque familiale avec scan IA

[![Stack](https://img.shields.io/badge/Stack-TypeScript%20Monorepo-blue)](./docs/TECHNICAL.md)
[![API](https://img.shields.io/badge/API-REST-green)](./docs/API.md)
[![Status](https://img.shields.io/badge/Status-MVP-orange)](./USER_STORIES.md)

---

## 🎯 Vision

Arcana est le **cœur numérique** de notre foyer. Il connecte Sylvia, Aliou, Sacha et Lisa à travers une organisation partagée et des moments de découverte littéraire.

## ✨ Fonctionnalités Principales

| Feature | Description | Statut |
|---------|-------------|--------|
| 📷 **Magic Shelf Scan** | Photographiez une étagère entière, tous les livres sont identifiés | ✅ |
| 📚 **Inventaire Intelligent** | Grille HD avec filtres puissants (statut, propriétaire, catégorie) | ✅ |
| 🔄 **Suivi des Prêts** | Ne perdez plus jamais un livre prêté | ✅ |
| 🤖 **Cartes de Lecture IA** | Résumés et questions (protégés anti-spoiler) | ✅ |
| � **Statut par Utilisateur** | Chaque membre suit sa propre progression | ✅ |
| 👶 **Mode Enfants** | Interface simplifiée pour Sacha et Lisa | ✅ |

## 🚀 Démarrage Rapide

```bash
# Prérequis: Node 20+, pnpm 9+, PostgreSQL

# 1. Cloner et installer
git clone <repo-url>
cd arcana
pnpm install

# 2. Configuration
cp .env.example .env
# Éditer .env avec vos clés API

# 3. Base de données
cd apps/api
pnpm prisma migrate dev

# 4. Lancer le projet
cd ../..
pnpm dev
```

**URLs de développement:**
- 🌐 Frontend: http://localhost:5173
- 🔌 API: http://localhost:3000

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [📐 Architecture Technique](./docs/TECHNICAL.md) | Stack, structure, patterns |
| [📋 Spécifications Fonctionnelles](./docs/FUNCTIONAL.md) | User stories, règles métier |
| [🔌 Référence API](./docs/API.md) | Endpoints, requêtes, réponses |
| [💻 Guide Développeur](./docs/DEVELOPMENT.md) | Setup, conventions, contribution |
| [📜 Manifeste Produit](./PRODUCT_MANIFESTO.md) | Vision et principes de design |

## 🏗️ Architecture

```
arcana/
├── apps/
│   ├── web/           # React SPA (Vite + shadcn/ui)
│   └── api/           # Express REST API (Prisma)
├── packages/
│   └── shared/        # Types et schémas Zod partagés
└── docs/              # Documentation complète
```

> Voir [TECHNICAL.md](./docs/TECHNICAL.md) pour l'architecture détaillée.

## 🛠️ Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18, Vite, TypeScript, shadcn/ui, TailwindCSS, Framer Motion |
| **Backend** | Node.js, Express, Prisma, Zod |
| **Base de données** | PostgreSQL |
| **IA** | Gemini 2.5 Flash (vision), Google Books API |
| **Monorepo** | Turborepo, pnpm workspaces |

## 📝 Mise à Jour de la Documentation

La documentation peut être mise à jour automatiquement après des changements majeurs:

```bash
# Via workflow Gemini
/update-docs

# Ou manuellement
pnpm docs:update
```

## 👥 L'Équipe Arcana

- **Aliou** - Développeur principal
- **Sylvia** - Product Owner & Testeuse UX
- **Sacha** (9 ans) & **Lisa** (6 ans) - Consultants Mode Enfants 👶

---

<p align="center">
  <em>Fait avec ❤️ pour la famille Konteye</em>
</p>
