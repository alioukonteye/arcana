# Skill: Data Architecture & Standards

**Context**: Technical standards for the Monorepo, Backend patterns, and Database Schema.
**Source Truth**: Formerly `ARCHITECTURE.md` & `.cursorrules` (Tech sections).

## 1. Stack Overview (Immutable)
-   **Monorepo**: TurboRepo (`apps/web`, `apps/api`, `packages/shared`).
-   **Frontend**: React + Vite.
-   **Backend**: Node.js + Express.
-   **Database**: PostgreSQL + Prisma ORM.
-   **Validation**: Zod (Shared across Front/Back).

## 2. Backend Pattern: Clean Architecture
Strict unidirectional flow:
`Controller (HTTP)` -> `Service (Business Logic)` -> `Repository (DB Access)`

-   **Controllers**:
    -   Handle Req/Res.
    -   Parse inputs via Zod.
    -   Return standardized HTTP codes.
    -   *Logic forbidden here.*
-   **Services**:
    -   Contain Pure Business Logic.
    -   Call multiple repositories or external APIs (Google Books).
    -   *No direct DB calls allowed.*
-   **Repositories**:
    -   Wrap Prisma Client.
    -   Handle CRUD operations.
    -   *No business logic allowed.*

## 3. Database Patterns (Prisma)
-   **Schema Location**: `apps/api/prisma/schema.prisma`
-   **Migrations**: Only via `prisma migrate dev`.
-   **Models**:
    -   `Book`: Core entity.
    -   `User`: Family members.
    -   `ReadingStatus`: Joint table (User <-> Book) for tracking.
    -   `Owner`: Enum (ALIOU, SYLVIA, SACHA, LISA, FAMILY).

## 4. Code Standards
-   **TypeScript**: Strict mode enabled. `No Explicit Any`.
-   **API Contracts**: All request/response bodies MUST be typed via Zod schemas in `packages/shared`.
-   **Error Handling**: Global Error Handler middleware in Express.
