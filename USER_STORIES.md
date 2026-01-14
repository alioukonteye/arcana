# User Stories - Arcana Books MVP

## US1: Magic Shelf Scan ✅
**As** a parent
**I want to** photograph my entire bookshelf
**So that** all books are automatically identified and added to inventory in one shot

### Acceptance Criteria
- Camera capture on device (mobile or desktop)
- **Gemini Flash** identifies ALL books visible on the shelf
- Google Books API cross-validation for each detected book
- **Auto-insert if confidence > 70%** (no blocking messages)
- Duplicate detection with "Multiple Copy" badge
- Silently skip unreadable books (no error messages)
- Display scan stats: detected, added, duplicates, skipped

---

## US2: Intelligent Inventory ✅
**As** a user
**I want to** see my books in a clean grid with powerful filters
**So that** I can quickly find any book in our family library

### Acceptance Criteria
- Grid layout with HD book covers from Google Books
- Status badges: "À lire", "En cours", "Lu"
- **Filter sidebar** with:
  - Status filter (read/unread)
  - Owner filter (Aliou, Sylvia, Sacha, Lisa, Family)
  - Category filter (from Google Books)
  - Author search
- Search functionality
- "Multiple Copy" indicator
- Owner badge on each book

---

## US3: Loan Tracking ✅
**As** Sylvia
**I want to** mark a book as "Lent to X"
**So that** we stop losing books to friends

### Acceptance Criteria
- `loanedTo` field on each book
- Simple "Prêter" button in Book Detail page
- "On Loan" badge displayed on book card and details
- Easy return tracking (Clear loan status)

---

## US7: External Reviews Integration
**As** a reader
**I want to** see what the world thinks of this book
**So that** I can gauge if it's worth starting

### Acceptance Criteria
- Fetch reviews/snippets from **Google Books API**
- Display using shadcn `blockquote` style styling
- Handle empty states gracefully (if no reviews found)

---

## US8: Book Detail Page Design (Apple-like)
**As** a user
**I want** a beautiful, immersive detail view
**So that** browsing my library feels like a premium experience

### Acceptance Criteria
- **Header**: Large cover, Serif typography for Title/Author.
- **Family Section**: "Who read this?" avatars/list (Aliou, Sylvia, etc.)
- **Layout**: Clean, white-space heavy, using native shadcn components.
- **No Custom CSS**: Use standard Tailwind utilities and theme variables.

## US4: AI Reading Cards (Anti-Spoiler) ✅
**As** a parent
**I want to** get AI-generated insights ONLY after marking "Lu"
**So that** I can discuss the book with kids without spoilers

### Acceptance Criteria
- **Strict Anti-Spoiler Rule**:
  - If Status != 'LU': **HIDE** all AI analysis. Show only standard metadata + "Read to unlock" message.
  - If Status == 'LU': Display full Arcana Reading Card (Analysis, Themes, Questions).
- **AI Content Generation**:
  - Button "Generate Analysis" if status is LU but no analysis exists.
- **Privacy**: Family reading status shown, but *their* private notes (if any) remain hidden from me.

---

## US5: Per-User Reading Status ✅
**As** a family member
**I want to** track my own reading progress independently
**So that** each person knows what they've read vs. what others have read

### Acceptance Criteria
- `ReadingStatus` model linking User + Book
- Each family member can mark their own status
- View who has read what in the book detail page

---

## US6: Kids Mode ✅
**As** Sacha/Lisa
**I want to** use a fun, simplified interface
**So that** I can explore books without complex menus

### Acceptance Criteria
- Toggle switch in header
- Larger touch targets
- Emoji-rich labels
- Simplified navigation
- Age-appropriate content display

---

## Family Profiles
The application is pre-configured with the Konteye family:
- **Aliou** (05.05.1985) - Parent
- **Sylvia** (05.09.1986) - Parent
- **Sacha** (08.11.2016) - Child
- **Lisa** (31.10.2019) - Child
