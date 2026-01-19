# Amélioration de la Précision d'Identification des Éditions de Livres

**Date:** 2026-01-19
**Objectif:** Garantir que la couverture du livre récupérée correspond précisément à l'édition spécifique détectée par le scan (version, édition, collection) et pas seulement au titre/auteur générique.

## 🔍 Problème Identifié

Le nouveau system prompt LLM (dans `llm.service.ts`) demande maintenant l'identification **précise de l'édition** avec :
- Éditeur et logo
- Collection spécifique (ex: "Folio SF" vs "Folio")
- Attributs visuels (couleurs, typographie, format)
- Détails d'édition

**Mais** le `GoogleBooksService` recherchait uniquement par titre + auteur, ignorant ces métadonnées précieuses, résultant en des couvertures génériques ne correspondant pas à l'édition physique possédée.

## ✅ Solution Implémentée

### 1. **Enrichissement du Schéma LLM** (`llm.service.ts`)

**Fichier:** `apps/api/src/services/llm.service.ts`

- Ajout du champ `isbn` au `ScannedBookSchema` (lignes 15-22)
- Mise à jour du prompt pour demander explicitement l'ISBN visible (ligne 112)
- L'ISBN est l'identifiant **unique** d'une édition spécifique

```typescript
const ScannedBookSchema = z.object({
  title: z.string().describe("Title of the book"),
  author: z.string().describe("Author of the book"),
  isbn: z.string().optional().describe("ISBN-10 or ISBN-13 if visible on the book"),
  publisher: z.string().optional().describe("Publisher if visible"),
  collection: z.string().optional().describe("Collection/Series name if visible"),
  visualHints: z.string().optional().describe("Visual details (colors, typography, cover art)"),
  confidence: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
});
```

**Nouveau prompt:** Demande explicitement à chercher l'ISBN sur la 4ème de couverture, la tranche, ou près du code-barres.

### 2. **Refactorisation de GoogleBooksService** (`googlebooks.service.ts`)

**Fichier:** `apps/api/src/services/googlebooks.service.ts`

#### 2.1 Nouvelle signature de `validateAndEnrich`

```typescript
async validateAndEnrich(
  title: string,
  author: string,
  isbn?: string,      // NOUVEAU: ISBN pour recherche précise
  publisher?: string,
  collection?: string // NOUVEAU: Collection pour filtrage
): Promise<ValidationResult>
```

#### 2.2 Nouvelle méthode `searchByISBN` (lignes 105-151)

- Recherche directe par ISBN = **confiance 100%**
- L'ISBN identifie **exactement** une édition spécifique
- Priorité #1 si ISBN disponible

```typescript
async searchByISBN(isbn: string): Promise<ValidationResult | null> {
  // Clean ISBN et recherche directe
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;

  // ISBN search = 100% confidence
  return { confidence: 1.0, ... };
}
```

#### 2.3 Stratégie de recherche hiérarchique

1. **Si ISBN disponible:** Recherche par ISBN (précision maximale)
2. **Sinon:** Recherche par titre + auteur + publisher + collection
3. **Fallback:** Recherche relaxée si aucun résultat

#### 2.4 Amélioration du matching (`findBestMatch`)

- Considère maintenant la **collection** dans le matching
- Vérifie la collection dans le titre/sous-titre du résultat Google Books
- Match parfait = titre + auteur + publisher + collection

#### 2.5 Amélioration du scoring (`calculateConfidence`)

**Nouveau système de points:**
- Titre: 50 points max
- Auteur: 50 points max
- Publisher: +20 points bonus
- **Collection: +15 points bonus** (NOUVEAU)
- Score dynamique basé sur les métadonnées disponibles

### 3. **Transmission des Métadonnées** (`books.service.ts`)

**Fichier:** `apps/api/src/services/books.service.ts`

Mise à jour de l'appel (lignes 44-50) pour transmettre **toutes** les métadonnées d'édition :

```typescript
const validation = await GoogleBooksService.validateAndEnrich(
  book.title,
  book.author,
  book.isbn,      // ISBN si détecté par LLM
  book.publisher,
  book.collection // Collection aide à identifier l'édition
);
```

## 📊 Impact Attendu

### Avant
- Recherche par titre/auteur uniquement
- Couverture générique (souvent la plus récente édition)
- Pas de correspondance avec l'édition physique possédée

### Après
- **Recherche par ISBN** si visible → Édition exacte (confiance 100%)
- **Filtrage par collection** → Distinction entre "Folio" et "Folio SF"
- **Scoring amélioré** → Meilleure sélection parmi plusieurs éditions
- **Couverture précise** correspondant à l'édition physique scannée

## 🧪 Cas de Test Suggérés

1. **Livre avec ISBN visible:** Vérifier que l'ISBN est détecté et utilisé
2. **Livre de collection spécifique:** Ex: "Le Seigneur des Anneaux" en Folio vs Folio SF
3. **Livre avec plusieurs éditions:** Vérifier que la bonne édition est sélectionnée
4. **Livre sans ISBN visible:** Vérifier le fallback sur titre/auteur/collection

## 📝 Notes Techniques

- **Compatibilité:** Tous les champs sont optionnels, pas de breaking change
- **Fallbacks:** Système de recherche dégradée si métadonnées manquantes
- **Performance:** Recherche ISBN très rapide (1 seul résultat attendu)
- **Logging:** Logs explicites pour debug (`🔍 Searching by ISBN`, `⚠️ ISBN search failed`)

## 🔗 Fichiers Modifiés

1. `apps/api/src/services/llm.service.ts`
   - Ajout champ ISBN au schéma
   - Amélioration du prompt (demande ISBN explicite)

2. `apps/api/src/services/googlebooks.service.ts`
   - Nouvelle méthode `searchByISBN`
   - Signature `validateAndEnrich` enrichie
   - Amélioration `findBestMatch` (collection)
   - Amélioration `calculateConfidence` (scoring collection)

3. `apps/api/src/services/books.service.ts`
   - Transmission ISBN + collection à `validateAndEnrich`

## ⚠️ Prochaines Étapes Recommandées

1. **Tester** avec un scan réel de livres ayant ISBN visible
2. **Vérifier** les logs pour s'assurer que les ISBNs sont détectés
3. **Comparer** les couvertures avant/après pour valider la précision
4. **Ajuster** le prompt si les ISBNs ne sont pas assez souvent détectés
