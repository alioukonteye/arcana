# Changelog - Arcana

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

---

## [2.0.0] - 2025-01-14

### ✨ Ajouté

- **Bulk Shelf Scan (US1 Enhanced)**
  - Détection de TOUS les livres sur une étagère en une seule photo
  - Seuil de confiance abaissé à 70% (insertion silencieuse)
  - Skip silencieux des livres illisibles
  - Affichage des statistiques: détectés, ajoutés, doublons, ignorés

- **Inventaire Intelligent (US2)**
  - Grille avec couvertures HD Google Books
  - Sidebar de filtres: statut, propriétaire, catégorie, auteur
  - Recherche textuelle complète
  - Badge propriétaire sur chaque livre

- **Suivi des Prêts (US3)**
  - Champ `loanedTo` sur chaque livre
  - Badge "En prêt" avec nom de l'emprunteur
  - Retour facile via API

- **Cartes de Lecture IA Anti-Spoiler (US4)**
  - Endpoint `/books/:id/reading-card`
  - Protection 403 si status != READ
  - Résumé profond, thèmes, questions de discussion
  - Niveau de lecture recommandé

- **Statut par Utilisateur (US5)**
  - Nouveau modèle `ReadingStatus` (User + Book)
  - Chaque membre suit sa propre progression
  - Vue "qui a lu quoi" sur la page détail

- **Mode Enfants (US6)**
  - Toggle dans le header
  - Labels riches en emojis
  - Cibles tactiles agrandies

- **Profils Famille**
  - Utilisateurs pré-configurés: Aliou, Sylvia, Sacha, Lisa
  - Endpoint `GET /users`

### 🔧 Modifié

- **API version 2.0.0**
  - 4 nouveaux endpoints: `/books/filters`, `/books/:id/reading-status`, `/books/:id/loan`, `/books/:id/reading-card`
  - Paramètres de filtrage sur `GET /books`

- **Schéma Prisma**
  - Nouveau modèle `ReadingStatus`
  - Champ `loanedTo` sur Book
  - Champ `categories` (array) sur Book
  - Index additionnels pour performances

### 📝 Documentation

- Mise à jour automatique via `/update-docs`
- Toutes les User Stories marquées ✅
- Diagrammes ER et séquence mis à jour

---

## [0.1.0] - 2025-01-14

### ✨ Ajouté

- **Magic Shelf Scan (US1)**
  - Identification de livres via Gemini 2.5 Flash
  - Validation croisée avec Google Books API
  - Auto-insertion avec seuil de confiance à 90%
  - Détection de doublons avec badge "Copie multiple"

- **Infrastructure**
  - Monorepo TypeScript avec Turborepo
  - Backend Express + Prisma + PostgreSQL
  - Frontend React + Vite + shadcn/ui
  - Package shared pour types Zod

- **Documentation**
  - README enrichi avec quick start
  - Documentation technique complète
  - Documentation fonctionnelle avec user stories
  - Référence API REST
  - Guide développeur
  - Workflow d'automatisation `/update-docs`

### 🏗️ Architecture

- Clean Architecture: Controller → Service → Repository
- Design system shadcn/ui (white-label ready)
- Variables CSS pour theming

---

## Légende

| Emoji | Type de changement |
|-------|-------------------|
| ✨ | Nouvelle fonctionnalité |
| 🐛 | Correction de bug |
| 🔧 | Modification technique |
| 📝 | Documentation |
| 🏗️ | Architecture |
| ⚠️ | Breaking change |
| 🗑️ | Suppression |
