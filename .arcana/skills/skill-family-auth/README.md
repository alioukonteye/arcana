# Skill: Family & Auth

**Context**: Manages authentication, family hierarchy, and user roles.
**Source Truth**: Formerly `USER_STORIES.md` (Family Profiles) & `ARCHITECTURE.md` (Security).

## 1. Authentication Strategy
-   **Provider**: Clerk (`@clerk/clerk-react` / `@clerk/clerk-sdk-node`).
-   **Access Control**: strict **Whitelist**.
    -   `aliou.konteye@gmail.com`
    -   `yourlittlenini@gmail.com`
    -   *Any other email is blocked at login/sign-up.*

## 2. Family Roster (The 4 Personas)
The system is hard-coded around the Konteye family structure.

| Name | Role | Access Level | DOB |
| :--- | :--- | :--- | :--- |
| **Aliou** | Parent | Admin / Full | 05.05.1985 |
| **Sylvia** | Parent | Admin / Full | 05.09.1986 |
| **Sacha** | Child | Kids Mode | 08.11.2016 |
| **Lisa** | Child | Kids Mode | 31.10.2019 |

## 3. Kids Mode Logic
**Switching Context**:
-   **Parent View**: Standard UI, Settings access, Spoiler controls.
-   **Kids Mode**:
    -   Activated via Toggle in Header.
    -   **UI Changes**: Larger fonts/buttons, simplified navigation, no complex filters.
    -   **Content**: Hides "Adult" tagged books (future feature) or complex analysis. Focus on Covers and simple statuses ("Lu", "Pas Lu").

## 4. Privacy & ownership
-   **Global Library**: All books are visible to everyone (except potentially sensitive ones).
-   **Personal Status**: `ReadingStatus` is unique per user (Aliou can be "Reading" while Sylvia is "Read").
-   **Ownership**: A book belongs to a specific family member (or "Family"), tracked via `owner` field.
