# Skill: Vision & Sourcing Strategy

**Context**: Handles the complex logic of bulk scanning, OCR, and external API enrichment.
**Source Truth**: Formerly `USER_STORIES.md` (US1, US7) & `ARCHITECTURE.md` (AI Pipeline section).

## 1. The Vision Pipeline (Bulk)
**Objective**: Scan an entire shelf in one shot.

### Process:
1.  **Image Capture**: User uploads shelf photo (Mobile/Desktop).
2.  **Gemini Flash (Vision)**:
    -   *Prompt*: "Analyse cette photo d'étagère. Identifie TOUS les livres visibles. Pour chaque livre, extrais le titre et l'auteur. Retourne un tableau JSON."
    -   *Model*: `gemini-2.5-flash` (Optimized for speed/volume).
3.  **Enrichment & Validation**:
    -   Parallel query to **Google Books API** for each detected book.
    -   Match logic: Fuzzy match Title + Author.
4.  **Confidence Scoring**:
    -   Score calculated based on OCR clarity + API match quality.
    -   **Threshold**: `≥ 70%` -> Auto-insert into DB.
    -   **Threshold**: `< 70%` -> Skip silently (No blocking errors).

## 2. Anti-Spoiler Engine
**Objective**: Preserve the magic of discovery vs. spoilers.

-   **Model**: `gemini-2.5-pro` (Reasoning).
-   **Trigger**: ONLY when User Status changes to `READ` (LU).
-   **Output**: "Arcana Reading Card" (Themes, Analysis, Discussion Questions).
-   **Rule**: If Status != `READ`, show *only* public metadata (Title, Author, Page count).

## 3. Data Source Priority
1.  **Google Books API**: Primary source for Metadata (Cover, Pages, Year, Categories).
2.  **Manually Entered**: Highest priority if user overrides.
3.  **AI OCR**: Fallback for titles not found in API.
