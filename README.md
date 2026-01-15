# Arcana 📚✨

> **Le foyer numérique familial** - Une application de gestion de bibliothèque familiale avec scan IA

[![Stack](https://img.shields.io/badge/Stack-TypeScript%20Monorepo-blue)](./.arcana/skills/skill-data-architecture/README.md)
[![API](https://img.shields.io/badge/API-REST-green)](./.arcana/skills/skill-data-architecture/README.md)
[![Status](https://img.shields.io/badge/Status-MVP-orange)](./.arcana/skills/skill-vision-sourcing/README.md)

---

## 🚀 AGENT SKILLS ARCHITECTURE

Le projet est structuré autour de **Skills** modulaires qui définissent les règles et la logique par domaine.
Veuillez vous référer à ces documents pour toute implémentation.

| Skill | Description | Lien |
| :--- | :--- | :--- |
| **🎨 Design Authority** | Règles UI/UX, shadcn/ui, Vibe Engineering | [Règles UI](./.arcana/skills/skill-design-authority/README.md) |
| **👁️ Vision & Sourcing** | Scan d'étagère, Google Books, Anti-spoiler | [Logique Scan](./.arcana/skills/skill-vision-sourcing/README.md) |
| **👨‍👩‍👧‍👦 Family & Auth** | Rôles (Kids Mode), Whitelist, Profils | [Règles Auth](./.arcana/skills/skill-family-auth/README.md) |
| **🏗️ Data Architecture** | Clean Arch, Prisma, Monorepo Stack | [Patterns Tech](./.arcana/skills/skill-data-architecture/README.md) |

---

## 🎯 Vision

Arcana est le **cœur numérique** de notre foyer. Il connecte toute la famille à travers une organisation partagée et des moments de découverte littéraire.

## ✨ Fonctionnalités Principales

| Feature | Description | Statut |
|---------|-------------|--------|
| 📷 **Magic Shelf Scan** | Photographiez une étagère entière, tous les livres sont identifiés | ✅ |
| 📚 **Inventaire Intelligent** | Grille HD avec filtres puissants (statut, propriétaire, catégorie) | ✅ |
| 🔄 **Suivi des Prêts** | Ne perdez plus jamais un livre prêté | ✅ |
| 🤖 **Cartes de Lecture IA** | Résumés et questions (protégés anti-spoiler) | ✅ |
| 👤 **Statut par Utilisateur** | Chaque membre suit sa propre progression | ✅ |
| 👶 **Mode Enfants** | Interface simplifiée pour les plus jeunes | ✅ |

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

## 🏗️ Architecture (Monorepo)

```
arcana/
├── .arcana/skills/    # 🧠 INTELLIGENCE DU PROJET
├── apps/
│   ├── web/           # React SPA (Vite + shadcn/ui)
│   └── api/           # Express REST API (Prisma)
├── packages/
│   └── shared/        # Types et schémas Zod partagés
```

## 👥 Contributeurs

Projet familial développé avec ❤️

---

<p align="center">
  <em>Fait avec ❤️ pour la famille</em>
</p>
