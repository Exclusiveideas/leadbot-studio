# Vibe Coding Design Tells — What to NEVER Produce

These are the patterns that experienced designers and developers can instantly spot as
AI-generated. Avoid ALL of them. This is the difference between "impressive" and "obviously
vibecoded."

---

## 1. The Purple Problem

**The tell**: Purple-to-blue or indigo gradients as the primary color scheme.

**Why it happens**: AI training data is saturated with Tailwind's default indigo/purple palette,
SaaS landing pages from 2020-2024, and OpenAI's purple branding. When asked for "modern" or
"tech," AI converges on purple because it appears most frequently in training data.

**What to do instead**:
- Use the LeadBotStudio warm gold-to-coral gradient (`#ffd78c` → `#ffab7a`)
- If a client needs different colors, choose from nature, architecture, or fashion — not tech
- Monochromatic schemes (varying shades of one hue) feel more designed than multi-color gradients
- Deep dark navy (`#0f172a`) + warm accent is inherently more premium than purple + white

---

## 2. The Inter Font Monoculture

**The tell**: Inter (or Geist, Roboto, system-ui) as the only font everywhere.

**Why it happens**: Inter is the default in most frameworks. AI picks the most common option.

**What to do instead**: See [fonts-and-typography.md](fonts-and-typography.md) for specific
recommendations. Use a display font for headings + different font for body. Font pairing is
what separates template from crafted.

---

## 3. The Rounded-Everything Epidemic

**The tell**: `rounded-lg` or `rounded-xl` applied uniformly to every element — buttons, cards,
inputs, images, badges, everything has the same border-radius.

**What to do instead**:
- Vary radius by component: `rounded-2xl` for large cards, `rounded-lg` for buttons,
  `rounded-md` for inputs, `rounded-full` for avatars/badges
- Some elements benefit from sharp corners (tables, code blocks, dividers)
- Mix rounded and sharp in the same section for visual contrast

---

## 4. The Three-Column Icon Grid

**The tell**: A "features" section with exactly 3 cards in a row, each with a centered icon
on top, a bold title, and 1-2 lines of description text. Same padding, same size, same layout.

**Why it happens**: This is the #1 most common section pattern in training data. Every
landing page template has it.

**What to do instead**:
- Bento grid (mixed sizes: 2 large + 2 small, or 1 hero + 3 small)
- Alternating image-text rows (image left/text right, then flip)
- Numbered list with staggered animations
- Interactive tabs or accordion
- Horizontal scroll section with GSAP
- Features with inline demos or screenshots, not abstract icons

---

## 5. The Generic Hero Section

**The tell**: Centered headline → centered subtext → centered CTA button → maybe a
placeholder image below. White background. Exactly `py-20`.

**Why it happens**: It's the most "average" hero layout from training data.

**What to do instead**:
- Split layout (text one side, visual the other)
- Full-bleed dark hero with animated background
- Hero with embedded product demo/video
- Asymmetric layout with offset heading
- Sticky hero that transforms on scroll (GSAP ScrollTrigger)

---

## 6. The Shadow-sm Epidemic

**The tell**: Every card, every element has `shadow-sm` or `shadow-md`. No variation in
elevation. Everything floats at the same level.

**What to do instead**:
- Create an elevation system: Level 0 (no shadow), Level 1 (subtle), Level 2 (cards),
  Level 3 (modals/dropdowns)
- Use `shadow-[0_4px_20px_rgba(0,0,0,0.08)]` for custom, softer shadows
- Combine shadow + border for more refined card edges
- Interactive elements get deeper shadow on hover (Level 2 → Level 3)

---

## 7. The Fade-Up Everything

**The tell**: Every single element has the exact same `fade-up` animation on scroll enter.
Same duration, same easing, same trigger point. The whole page is a waterfall of identical
animations.

**Why it happens**: AI applies the same motion pattern to everything because it doesn't
understand animation choreography.

**What to do instead**:
- Stagger children: first child at 0ms, second at 60ms, third at 120ms
- Vary animation types: headlines slide in from left, images scale up, stats count up
- Use GSAP ScrollTrigger for pinned sections and parallax
- Some sections should NOT animate — let content breathe
- Only animate elements entering the viewport, not everything on the page

---

## 8. The Gradient Text Overload

**The tell**: Multiple gradient-text headings on the same page. Every section title has a
different gradient. "Modern" ≠ gradient text everywhere.

**What to do instead**:
- Max ONE gradient text element per viewport (usually the hero headline)
- Use bold weight or color change for emphasis elsewhere
- Gradient text works on large text only — never on body copy or small labels
- The warm gold gradient is the brand's signature — keep it rare and impactful

---

## 9. The Pill-Shaped Badge

**The tell**: Small rounded-full pill badges with gradient or pastel backgrounds above every
section title: "NEW", "FEATURES", "PRICING", "AI-POWERED". Every section has one.

**What to do instead**:
- Use these sparingly — max 1-2 per page (hero + one other section)
- Simple text labels with subtle styling work better for most sections
- Consider a thin line or dash before section titles instead
- If using a badge, make it visually distinct from others on the page

---

## 10. The Flat White Page

**The tell**: Pure white background (#fff) for the entire page. No texture, no gradient, no
visual layers. Content sits on a blank canvas.

**What to do instead**:
- Alternate section backgrounds: white → `#f8fafc` → white → dark
- Add subtle dot grid or noise texture to light sections
- Use radial gradient blurs (the `glow-orb` pattern) for depth
- Dark sections (`#0f172a`) break monotony and create visual rhythm

---

## 11. The Identical CTA

**The tell**: Every section ends with the same "Get Started" or "Try Now" button. Same color,
same size, same position. The whole page is a column of CTAs.

**What to do instead**:
- Primary CTA only in hero and final section
- Inline text links within feature descriptions
- Vary CTA text: "See how it works", "View pricing", "Book a demo"
- Not every section needs a CTA — let users read and explore

---

## 12. The Timid Typography

**The tell**: Headlines at 32-36px, body at 16px. A 2x ratio that feels safe and boring.
All the same weight. No personality.

**What to do instead**:
- Hero headlines: 56-80px (mobile: 36-48px) with tight leading (1.05-1.15)
- Section headers: 36-48px
- Body: 16-18px with generous leading (1.6-1.7)
- Use 300 weight for elegance, 800-900 for impact
- Vary: some headings serif, some sans, some with letter-spacing adjustments

---

## 13. The Centered-Everything Layout

**The tell**: Every section is center-aligned: centered title, centered paragraph, centered
button. The entire page is a vertical stack of centered blocks.

**What to do instead**:
- Left-align most body text (easier to read)
- Center only hero headlines and short section titles
- Use split layouts, grid layouts, offset elements
- Right-align occasional elements for visual variety
- Place CTAs at the start of text blocks (left), not always centered

---

## 14. Stock Icon Abuse

**The tell**: Abstract Lucide/Heroicons scattered throughout with no relation to the actual
product. Shield icon for "security", rocket for "fast", sparkles for "AI".

**What to do instead**:
- Use product screenshots or actual UI previews
- Custom illustrations or branded graphics
- If using icons, style them distinctively (larger, with background shapes, colored)
- Use icons as supporting elements, not as section centerpieces

---

## 15. The Missing Details

**The tell**: No favicon, no custom 404, no loading states, no empty states, no error states,
no micro-interactions on buttons, no custom scrollbar, no selection color.

**What to do instead**:
- Custom favicon matching the brand
- Branded 404 page (LeadBotStudio already has one)
- Selection color: `::selection { background: rgba(255, 215, 140, 0.3) }` (already done)
- Button press effect: slight scale-down on active
- Input focus rings in brand accent color
- Skeleton loaders for async content
- Toast notifications with brand styling

---

## 16. The Glassmorphism Default

**The tell**: Every card uses `backdrop-filter: blur()` with semi-transparent backgrounds
and subtle white borders. Frosted glass on everything — cards, navbars, modals, tooltips.

**Why it happens**: Glassmorphism was trendy in 2022-2024 and appears heavily in training
data. AI treats it as the default card style.

**What to do instead**:
- Use glassmorphism only for overlays (navbar on scroll, modal backdrops)
- Cards should have solid backgrounds with subtle borders, not transparency
- Reserve blur effects for 1-2 elements max per page
- Solid `bg-white` or `bg-brand-surface` with a good shadow is more professional

---

## 17. The hover:scale-105 Card

**The tell**: Every card has `hover:scale-105 transition-transform`. The whole card bloats
on hover. It's the universal AI hover effect.

**What to do instead**:
- `hover:-translate-y-1` (subtle lift) + shadow increase is more refined
- Hover border color change (border goes from `border-brand-border` to `border-brand-accent-from`)
- Background tint shift on hover
- Only interactive cards need hover effects — informational cards don't

---

## 18. The Vercel/Linear/Stripe Clone

**The tell**: The overall aesthetic is an obvious clone of Vercel, Linear, or Stripe —
dark mode, minimal, grid backgrounds, gradient text. These sites are AI training data
favorites.

**Why it happens**: These are the most admired SaaS designs, so they dominate training
datasets. AI reproduces their aesthetic regardless of whether it fits the brand.

**What to do instead**:
- LeadBotStudio serves law firms, coaches, therapists — not developer tools
- Warm, approachable, professional aesthetic beats cold/techy
- Look at non-tech references: Squarespace, Mailchimp, HubSpot, Calendly
- The audience is non-technical business owners, not engineers

---

## 19. The Predictable Page Formula

**The tell**: Every vibe-coded landing page follows this exact sequence:
1. Sticky navbar (blurred)
2. Centered hero (gradient headline, two buttons)
3. Logo bar ("Trusted by...")
4. 3-column feature grid
5. Alternating feature rows (image/text, text/image)
6. Testimonial cards (3, with avatars)
7. Pricing (3 tiers, middle highlighted)
8. FAQ accordion
9. Final CTA ("Ready to get started?")
10. 4-column footer

**What to do instead**:
- Break the formula: skip sections that aren't needed
- Combine sections: testimonials alongside features, pricing in a different format
- Add unexpected sections: interactive demo, case study, video walkthrough
- Vary section widths: some full-bleed, some narrow, some split
- Use scroll-based storytelling (GSAP) instead of stacked rectangles

---

## 20. The Cursor Glow / Particle Background

**The tell**: A radial gradient that follows the mouse cursor. Or floating particle dots
in the background using tsparticles or similar. "Cool" effects that add no value.

**Why it happens**: These appear impressive in demos and get upvotes. AI learns they're
"modern."

**What to do instead**:
- Background effects should be static or very subtle (slow-moving glow orbs)
- Cursor effects are distracting and hurt performance on mobile
- If you need visual interest, use subtle CSS-only patterns (dot grids, gradient meshes)
- The content should be interesting, not the background

---

## 21. Style Without Substance

**The tell**: The site looks "expensive" and polished on the surface but has no real
content, personality, or unique design decisions. It's designed for screenshots, not actual
use. Over-designed for the product's stage.

**What to do instead**:
- Every design element should serve the product's actual users
- Real product screenshots > abstract gradient blobs
- Specific copy > generic power verbs ("Unlock", "Supercharge", "Revolutionize")
- Design should match the product's maturity — a pre-launch landing page shouldn't
  look like it has a 20-person design team behind it
- Personality comes from specific choices: a unique illustration style, a distinctive
  color, an unexpected layout — not from flashy effects
