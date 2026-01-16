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

🛡️ Adaptability Protocol (Scale-Adaptive Intelligence)
To optimize project velocity while ensuring industrial-grade stability, the assistant must adjust its depth of reasoning based on the nature of the requested task:

Category A: UI/UX & Design ("Fast Vibe" Mode)
Scope: CSS adjustments, creation of presentational components, animations, icons, text modifications, or theme updates.

Expected Behavior: Direct, creative, and fast execution. Absolute priority given to visual elegance and adherence to native shadcn/ui components. No heavy technical justification required.

Objective: Meet Sylvia’s aesthetic requirements and maintain the playful feel for Sacha and Lisa without slowing down the creative flow.

Category B: Logic, Database, Auth & Architecture ("High Precision" Mode)
Scope: Prisma schema, database migrations, security (Clerk, Whitelist), complex business logic, AI service integration (Gemini).

Expected Behavior: MANDATORY HALT before any code modification. The assistant must submit an impact plan or a technical note detailing:

Changes to TypeScript types.

Data security implications.

Potential side effects on other services.

Objective: Guarantee the "Zero Debt" principle, ensure the security of the Family Hub, and allow Aliou to validate every architectural choice to enhance his technical expertise.