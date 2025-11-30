# Design Guidelines for "Acta" - Spanish Meeting Transcription PWA

## Design Direction & Aesthetic
**Inspiration**: Granola.ai meets Descript - modern, warm, trustworthy professional tool
**Target Users**: 45-65 year old Spanish secretaries with low tech literacy
**Tone**: Governmental/official yet approachable and simple
**Overall Vibe**: Calm and confident (not playful), spacious with breathing room, one primary action per screen, clear hierarchy with obvious next steps, professional but human

## Color Palette
**Primary**: Deep blue (#1e3a8a) or forest green (#065f46) for trust and professionalism
**Accent**: Warm amber (#f59e0b) or coral (#fb7185) for friendly action states
**Backgrounds**: Warm cream/off-white (#fefce8 or #fef3c7), never pure white
**Text**: Warm dark grays (#374151, #1f2937) with high contrast for readability
**Success States**: Soft green (#86efac)
**Recording State**: Pulsing red (#ef4444) or amber (#f59e0b)

## Typography
**Headings**: Inter (bold weights, 600-700)
**Body**: Inter Regular, 16px minimum size
**Line Height**: Generous 1.6-1.8 for readability
**Language**: All text in Spanish
**Hierarchy**: Clear size differentiation between headings and body text

## Layout & Spacing
**Container Width**: max-w-6xl for main content areas
**Margins/Padding**: Generous 24-32px (p-6 to p-8)
**Touch Targets**: Minimum 48px height for all interactive elements
**Spacing System**: Use tailwind units of 4, 6, 8, 12, 16, 20, 24, 32 (e.g., p-6, h-12, m-8)
**Card Shadows**: Subtle 4-8px blur (shadow-md to shadow-lg)

## Key Screen Specifications

### Dashboard/Home
- Large centered "Nueva Acta" button (~200px wide, primary accent color)
- Grid/list of recent meetings below (cards with: building name, date, status badge)
- Top navigation: App logo left, search center, user avatar right
- Empty state: Beautiful illustration + "Comienza tu primera acta"
- Card layout: Grid with 2-3 columns on desktop, single column on mobile

### Recording Screen
- Fullscreen/focused mode with minimal chrome
- Center: Large pulsing circle or waveform visualization
- Top: Building name and attendees count
- Center bottom: Large timer (MM:SS format)
- Bottom controls: Large Pause button, destructive red Stop button
- Maximum focus, minimal distractions

### Review/Edit Screen
- Split layout (60/40 desktop, stacked mobile)
- Left: Editable transcript (click-to-edit inline, clean typography)
- Right: Live preview of formatted Spanish legal "Acta" document
- Bottom: Descript-style audio player (waveform, play/pause, timeline)
- Top right: "Generar Acta" primary button

### Send Screen
- Top: Preview card of PDF acta (elegant with shadow)
- Middle: Email recipient chips (Gmail-style, drag to reorder)
- Subject line field (pre-filled, editable)
- Bottom: Large "Enviar Acta" button
- Success state: Smooth checkmark animation + "Acta enviada correctamente"

## UI Components
**Buttons**: Large, touch-friendly (min h-12), rounded corners (rounded-lg), smooth transitions
**Cards**: Subtle shadows (shadow-md), rounded corners (rounded-xl), generous padding (p-6)
**Status Badges**: Rounded-full, small text, contextual colors (Grabando: red pulse, Procesando: amber, Enviado: green)
**Progress Indicators**: Skeleton screens preferred over spinners
**Input Fields**: Large (h-12), clear labels, high contrast borders
**Icons**: Phosphor or Lucide (outline style, not filled), consistent sizing (w-5 h-5 or w-6 h-6)

## Interactions & States
**Transitions**: Smooth, 200-300ms duration
**Hover States**: Subtle brightness or scale changes (hover:brightness-110)
**Active States**: Slightly reduced scale (active:scale-95)
**Loading States**: Skeleton screens with subtle shimmer animation
**Empty States**: Centered illustrations with encouraging Spanish copy
**Focus States**: Clear outline for keyboard navigation (ring-2 ring-offset-2)

## Accessibility
**Contrast**: WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)
**Touch Targets**: Minimum 48x48px for all interactive elements
**Font Sizes**: Never below 16px for body text
**Focus Indicators**: Always visible for keyboard navigation
**Color Independence**: Never rely solely on color to convey information

## Images
**Hero Images**: Not applicable for this tool-focused PWA
**Illustrations**: Use for empty states and onboarding - warm, friendly, minimal style
**Icons**: Throughout interface for actions and status indicators
**Waveform Visualization**: Dynamic SVG or canvas-based for recording screen

## Design System Approach
Following **Material Design** principles adapted with warmer aesthetics:
- Clear visual hierarchy through elevation (shadows)
- Touch-friendly interaction targets
- Responsive grid system
- Consistent spacing rhythm
- Generous whitespace for reduced cognitive load

## Mobile Responsiveness
**Breakpoints**: 
- Mobile: < 768px (single column, stacked layouts)
- Tablet: 768px - 1024px (2 columns where appropriate)
- Desktop: > 1024px (full multi-column layouts)
**Navigation**: Hamburger menu on mobile, full nav on desktop
**Touch Optimization**: All buttons minimum 48px, increased spacing between elements