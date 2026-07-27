---
name: Classroom Story
colors:
  surface: '#fdf7ff'
  surface-dim: '#e0d4ff'
  surface-bright: '#fdf7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f1ff'
  surface-container: '#f3eaff'
  surface-container-high: '#ede4ff'
  surface-container-highest: '#e8ddff'
  on-surface: '#1f1538'
  on-surface-variant: '#494552'
  inverse-surface: '#342b4f'
  inverse-on-surface: '#f5eeff'
  outline: '#7a7584'
  outline-variant: '#cac4d4'
  surface-tint: '#664aba'
  primary: '#6145b5'
  on-primary: '#ffffff'
  primary-container: '#7a5fd0'
  on-primary-container: '#fdf7ff'
  inverse-primary: '#cdbdff'
  secondary: '#815600'
  on-secondary: '#ffffff'
  secondary-container: '#fdb333'
  on-secondary-container: '#6c4700'
  tertiary: '#a0342b'
  on-tertiary: '#ffffff'
  tertiary-container: '#c14c40'
  on-tertiary-container: '#fff7f6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e8deff'
  primary-fixed-dim: '#cdbdff'
  on-primary-fixed: '#20005f'
  on-primary-fixed-variant: '#4d30a1'
  secondary-fixed: '#ffddb1'
  secondary-fixed-dim: '#ffba49'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#614000'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#86211a'
  background: '#fdf7ff'
  on-background: '#1f1538'
  surface-variant: '#e8ddff'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 80px
    fontWeight: '700'
    lineHeight: 100px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 80px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 40px
    fontWeight: '500'
    lineHeight: 60px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 48px
  label-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 32px
  margin-edge: 64px
  card-padding: 48px
  stack-gap: 24px
---

## Brand & Style
The design system focuses on "짬짬이 이야기," a digital storytelling and classroom management tool for elementary school teachers. The brand personality is encouraging, professional, and highly legible, tailored specifically for high-visibility environments like electronic blackboards. 

The aesthetic is a **Sophisticated Card-based** style with a hint of **Tactile Brutalism**. It utilizes clean, white surfaces against a soft lavender backdrop to reduce eye strain while maintaining a cheerful atmosphere. Physicality is expressed through "hard" shadows, mimicking stacked paper cards to provide clear visual cues for interactable elements, ensuring students at the back of the classroom can easily follow the lesson flow.

## Colors
This design system uses a high-contrast palette to ensure readability across large displays. 
- **Primary (Purple):** Used for main actions, active states, and branding.
- **Surface (White):** All content "cards" must be white to stand out against the background.
- **Background (Lavender):** A soft, non-white background reduces glare on electronic blackboards.
- **Accents:** Amber, Coral, Sky, and Mint are used for categorization (e.g., different subjects or types of activities) to create a vibrant, organized interface.
- **Text (Indigo):** A deep, saturated purple-black provides better harmony than pure black while maintaining maximum contrast.

## Typography
Typography is scaled specifically for classroom visibility. The primary font is **Pretendard** (mapped to Be Vietnam Pro/Plus Jakarta Sans for stylistic tokens), a neutral Sans-serif optimized for Korean and English legibility. 

- **Scale:** The base body text starts at 40px to ensure the last row of students can read the content comfortably.
- **Headings:** Always bold and impactful. Use Display LG for title screens and Headline LG for card titles.
- **Line Height:** Generous leading (1.5x for body) prevents text crowding on large screens.
- **Hierarchy:** Use weight and color (Primary or Neutral) rather than small font sizes to establish hierarchy.

## Layout & Spacing
The system uses a **Fluid Grid** with generous safe zones. 
- **Grid:** A 12-column system with large 32px gutters to accommodate thick card shadows.
- **Margins:** Screen edges should maintain a minimum of 64px margin to prevent content from being cut off by blackboard frames.
- **Touch Targets:** All interactive elements must be at least 80px in height to accommodate both mouse clicks and touch/stylus input on electronic boards.
- **Rhythm:** An 8px linear scale governs all spacing.

## Elevation & Depth
Depth is not communicated through blurs or light sources, but through **Hard Drop Shadows**. 
- **Card Depth:** Cards use a `0px 4px 0px #241B3E` (Neutral color) offset shadow. This creates a "Paper-Card" feel that looks grounded and intentional.
- **Active State:** When a card or button is pressed, the shadow should shift to `0px 1px 0px` or `none`, with a slight `Y` translation to simulate a physical button press.
- **Layering:** Background blurs are avoided to ensure maximum rendering performance on various browser-based blackboard softwares.

## Shapes
The shape language is friendly and approachable. 
- **Corner Radius:** A consistent 20px radius is applied to all main cards, buttons, and input fields.
- **Borders:** Use a 2px solid border for secondary elements to match the icon stroke weight.
- **Icons:** SVG line icons only. Icons must feature a 2px stroke width with rounded ends (`stroke-linecap: round`) and rounded joins (`stroke-linejoin: round`).

## Components
- **Cards:** The primary container. Always White (#FFFFFF) with a 20px radius and a 4px hard indigo shadow. Padding should be a minimum of 48px.
- **Buttons:**
    - *Primary:* Purple background, White text, hard shadow.
    - *Secondary:* White background, 2px Primary border, Primary text, hard shadow.
- **Chips/Badges:** Use Accent colors (Amber, Coral, etc.) with 2px borders for categorization. These do not require shadows.
- **Input Fields:** Large 20px rounded containers with a 2px Neutral border. Focus state changes border to Primary color with a 4px hard shadow.
- **Lists:** Items should be separated by 24px (stack-gap) and housed in individual cards or separated by 2px dividers.
- **Interactive Icons:** Icons should be wrapped in a 80x80px touch target area. Use the 2px stroke weight consistently.