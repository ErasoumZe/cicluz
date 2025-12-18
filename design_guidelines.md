# CICLUZ Design Guidelines

## Design Philosophy
Create a therapeutic, emotionally intelligent interface that feels safe, welcoming, and healing. The design should embody fluidity, warmth, and personal growth through soft shapes, flowing transitions, and the CICLUZ multicolored gradient identity.

## Design Approach
**Custom Therapeutic Design** inspired by the CICLUZ brand identity, focusing on emotional wellness and personal transformation. The interface should feel like a gentle companion in the user's healing journey.

## Typography
- **Primary Font**: Inter or Outfit (thin/light weights 300-400 for body, 500-600 for headings)
- **Display**: Large, airy headlines with generous letter-spacing (tracking-wide)
- **Body**: 16px base size, line-height relaxed (1.7-1.8)
- **Hierarchy**: Subtle weight variations rather than dramatic size changes

## Layout System
**Spacing**: Use Tailwind units of 4, 6, 8, 12, 16, 20 for consistent rhythm
- Small gaps: `gap-4`, `p-6`
- Section padding: `py-12 md:py-16 lg:py-20`
- Container max-width: `max-w-6xl` for content, `max-w-7xl` for dashboard grids
- Generous whitespace: Never crowd elements, embrace breathing room

## Core Visual Elements

### Shapes & Borders
- Rounded corners everywhere: `rounded-2xl` for cards, `rounded-full` for buttons/avatars
- Circular elements: Use circles for emotional state indicators, progress rings, profile avatars
- Soft shadows: `shadow-lg shadow-purple-100/50` for depth without harshness
- Gradient overlays: Subtle radial gradients on hero sections and key interaction areas

### Component Library

**Cards**: Elevated, soft-shadowed containers with rounded-2xl borders
- Dashboard emotion cards with circular indicators
- Diary entry cards with flowing left border accent
- Video thumbnail cards with gradient overlays on hover

**Buttons**:
- Primary: Full rounded (`rounded-full`), gradient background, white text, generous padding (px-8 py-3)
- Secondary: Outlined with gradient border, transparent background
- Tertiary: Text-only with subtle underline on hover
- When on images: Add `backdrop-blur-md bg-white/20` for glass morphism effect

**Forms**:
- Soft, rounded inputs (`rounded-xl`)
- Floating labels with smooth transitions
- Focus states: Gradient border glow
- Multi-step questionnaire: Progress circles at top, one question per screen with smooth slide transitions

**Navigation**:
- Side navigation: Fixed left sidebar with circular icons
- Top bar: Minimal, showing user emotional state as a subtle gradient orb
- Mobile: Bottom tab bar with gradient active state

**Data Displays**:
- Emotional energy map: Radial chart with S+/IS− quadrants
- Progress rings: Circular progress indicators with gradient strokes
- Timeline: Vertical flow with circular nodes and connecting gradient lines

**Modals/Overlays**:
- Glass morphism backdrop (`backdrop-blur-lg bg-white/70`)
- Centered, rounded-3xl containers
- Gentle slide-up entrance animation

## Animations
**Minimal & Purposeful**:
- Smooth transitions: `transition-all duration-300 ease-out`
- Hover states: Subtle scale (scale-[1.02]) and shadow increase
- Page transitions: Gentle fade with slight vertical movement
- Loading states: Pulsing gradient shimmer (not spinners)
- Avoid: Excessive motion, auto-playing carousels, distracting effects

## Module-Specific Layouts

### Dashboard
- 2-column grid on desktop (emotional map left, quick actions right)
- Emotional energy visualization: Large circular chart as focal point
- Quick action cards: Grid of 4 rounded cards (2×2 on desktop, stacked on mobile)

### Consultório Virtual (Virtual Consultation)
- Single-column, centered questionnaire (max-w-2xl)
- Large, breathing question text
- Circular progress indicators at top
- Floating "next" button with gradient

### Trilhas Terapêuticas (Video Tracks)
- Masonry grid for video thumbnails (2-3 columns)
- Category pills: Rounded-full chips with gradient backgrounds
- Video player: Full-width with rounded corners, custom controls

### Diário (Diary)
- Timeline view: Vertical flow with entries as cards
- Entry composer: Expandable textarea with emotional state selector (circular mood buttons)
- Filters: Horizontal scroll of rounded filter chips

### Agenda Inteligente
- Calendar view: Soft grid with rounded day cells
- Task cards: Left gradient accent stripe, checkbox with smooth check animation
- Emotional forecast: Wave graph with gradient fill

### Mapa Mental
- Four-quadrant radial layout (Eu, Relações, Realização, Propósito)
- Circular nodes connected by curved gradient lines
- Interactive: Nodes expand on click to show details

## Accessibility
- WCAG AA contrast ratios (even with gradients - ensure text readability)
- Focus indicators: Visible gradient ring on keyboard navigation
- Form labels: Always present, never placeholder-only
- Touch targets: Minimum 44×44px for all interactive elements

## Images
**Strategic Placement**:
- **Hero Section**: Soft, abstract gradient background (not photographic) - think flowing colors, ethereal light
- **Video Thumbnails**: Actual video stills with gradient overlay on hover
- **Profile/Avatar**: Circular user photos with gradient ring border
- **Emotional State Illustrations**: Simple, abstract iconography representing moods (custom or from illustration library like unDraw)

**No Images Needed**:
- Rely on gradients, shapes, and the CICLUZ color palette for visual interest
- Icons from Heroicons or similar for UI elements

---

**Critical Success Factors**:
- Every screen should feel calm and spacious, never cramped
- Gradients should be subtle and tasteful, enhancing rather than dominating
- Round everything - sharp corners contradict the therapeutic essence
- Trust the whitespace - it's therapeutic
- Prioritize emotional clarity over information density