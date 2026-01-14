# Arcana Architecture

## Overview
Arcana is a family digital hub built as a TypeScript Monorepo.
It follows a clear isolation of concerns between the internal API and the "White-Label" frontend.

## Stack Choices
- **Frontend**: React + Vite (SPA). Fluid, "Apple-like" performance.
- **Backend**: Node.js + Express (REST API). Standard, reliable.
- **Database**: PostgreSQL with Prisma ORM. Type-safe, relational.
- **Validation**: Zod (Shared between Front and Back).
- **Styling**: TailwindCSS + Shadcn/ui (Native implementation).

## Monorepo Internal Structure
```
/
├── apps/
│   ├── web/      # The Family Dashboard (Vite)
│   └── api/      # Arcana Core (Express)
├── packages/
│   └── shared/   # Shared DTOs, Types, and Validators
```

## Backend Architecture
We follow the **Controller-Service-Repository** pattern:
1.  **Controller**: Handles HTTP requests, validates input (Zod), sends response.
2.  **Service**: Contains business logic (e.g., calling Gemini API, complex sorting).
3.  **Repository**: Interactions with Prisma/DB.

## Frontend Philosophy
- **Zero-Debt**: No custom CSS classes where Tailwind suffices.
- **Vibe Engineering**: Focus on transitions and empty states.
- **Components**: Strict usage of Shadcn/ui.
