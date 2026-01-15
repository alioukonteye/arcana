# Skill: Design Authority

**Context**: Defines the visual identity and user experience for Arcana.
**Source Truth**: Formerly `PRODUCT_MANIFESTO.md` & `.cursorrules` (UI sections).

## 1. Philosophy: Digital Hearth
Arcana connects the family (Aliou, Sylvia, Sacha, Lisa). The interface must be:
- **Sylvia Approved**: Apple-like simplicity, Zen, whitespace-heavy.
- **Micro-interactions**: "Vibe Engineering" with Framer Motion, skeleton loaders (no spinners), confetti on success.
- **Kids First**: Adaptable UI for Sacha (9) & Lisa (6).

## 2. STRICT Styling Rules
- **100% shadcn/ui Native**: Use components from `@/components/ui` as-is.
- **NO Custom CSS**:
    - No CSS files (except global `index.css` for variables).
    - No `styles` objects.
    - No Tailwind `@apply` hacks.
- **Theming via Variables**:
    - All colors/radius defined in `:root` (CSS variables).
    - Hardcoded colors (hexcodes) are **FORBIDDEN**.

## 3. UI Patterns
- **Layout**: Verified "Apple-like" layout. Large covers, serif typography for titles, clean grids.
- **Feedback**:
    - Optimistic updates.
    - Skeleton screens for loading.
    - Dialogs/Toasts for interactions (native shadcn).
- **Kids Mode**:
    - Toggle via context.
    - Increases touch targets.
    - Simplifies navigation/labels.
    - Uses fun animations.

## 4. Component Standards
- Imports: `import { Button } from "@/components/ui/button"`
- Icons: Lucide React only.
- Animation: `framer-motion` for page transitions and micro-interactions.
