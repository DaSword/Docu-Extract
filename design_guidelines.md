# Financial Document Processing Application - Design Guidelines

## Design Approach
**System Selected**: Material Design 3 with Fluent Design influences
**Rationale**: Financial applications demand clarity, predictable interactions, and information density. Material's elevation system and Fluent's focus on productivity create the ideal foundation for document processing workflows.

## Core Design Elements

### Typography Hierarchy
- **Primary Font**: Inter (via Google Fonts CDN)
- **Monospace Font**: JetBrains Mono (for financial data/numbers)

**Scale**:
- Page titles: 32px/2rem, semibold
- Section headers: 24px/1.5rem, semibold  
- Document names: 18px/1.125rem, medium
- Form labels: 14px/0.875rem, medium
- Body text: 16px/1rem, regular
- Data fields: 16px/1rem, monospace medium
- Helper text: 14px/0.875rem, regular

### Layout System
**Spacing Primitives**: Tailwind units 2, 4, 6, 8, 12
- Component padding: p-6
- Section gaps: gap-6 to gap-8
- Card spacing: p-8
- Tight spacing: p-4
- Dense lists: gap-2

**Grid Structure**:
- Main container: `grid grid-cols-12 gap-6` with max-w-screen-2xl
- Left panel (documents + forms): `col-span-8`
- Right panel (chat): `col-span-4 h-screen sticky top-0`

## Component Library

### Document Upload Zone (Top Section)
- Full-width card with dashed border treatment
- Height: min-h-48, expandable based on uploaded documents
- Drag-and-drop indicator with upload icon (Heroicons: cloud-arrow-up)
- Uploaded documents display as horizontal cards with: filename, file size, status badge, remove icon
- Status badges: Processing/Complete/Error states

### Form Preview Panel (Bottom-left)
- Structured card layout with subtle elevation
- Auto-populating fields organized in 2-column grid (grid-cols-2 gap-4)
- Field groups with clear section headers
- Input styling: border treatment with focus states, right-aligned values for currency
- Confidence indicators: Small colored dots next to auto-filled fields (high/medium/low confidence)
- Edit icons (Heroicons: pencil) for manual overrides

### AI Chat Assistant (Right Panel)
- Fixed height with internal scroll (h-screen overflow-y-auto)
- Chat header: Avatar + "AI Assistant" title + status indicator
- Message bubbles: User messages right-aligned, AI responses left-aligned with subtle background
- Input area fixed at bottom with text field + send button (Heroicons: paper-airplane)
- Suggested prompts displayed as chip buttons when idle
- Typing indicator animation

### Navigation Bar
- Top horizontal bar with logo left, user profile right
- Upload history dropdown, settings icon
- Height: h-16 with border-b

### Data Table Components (within forms)
- Line item tables with alternating row backgrounds
- Sortable headers with icons
- Inline editing capabilities
- Sum totals row with emphasized styling

## Icons
**Library**: Heroicons via CDN
**Key Icons**: document-text, cloud-arrow-up, pencil, paper-airplane, check-circle, exclamation-circle, trash

## Interaction Patterns
- Upload: Drag-and-drop with click fallback
- Auto-fill: Smooth fade-in animation for populated fields (300ms)
- Chat scroll: Auto-scroll to latest message
- Field validation: Inline error messages below fields
- Document preview: Click document card to expand preview modal

## Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation: Tab through upload → form fields → chat
- Focus visible states with 2px outline
- Form field labels always visible (no placeholder-only patterns)
- Color-independent status indicators (icons + text)

## Images
**No hero images required** - This is a working application interface focused on functionality. All visual elements serve data processing workflows.