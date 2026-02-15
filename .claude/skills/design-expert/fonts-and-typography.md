# Fonts & Typography System

The single biggest differentiator between a vibecoded site and a designed site is typography.
Font pairing, sizing, spacing, and weight variation create 80% of a design's personality.

---

## Recommended Font Pairings for LeadBotStudio

### Pairing 1: Premium SaaS (Recommended)
- **Headings**: `"Plus Jakarta Sans"` (Google Fonts) — geometric, modern, distinctive
- **Body**: `"Inter"` or `"DM Sans"` — clean, highly legible
- **Why**: Plus Jakarta Sans has distinctive character shapes that immediately differentiate
  from the Inter-everywhere look while remaining professional

### Pairing 2: Editorial Authority
- **Headings**: `"Fraunces"` (Google Fonts) — variable serif, warm, editorial
- **Body**: `"Inter"` or `"Source Sans 3"`
- **Why**: Serif headings + sans body is a classic editorial pattern that signals authority.
  Ideal for law firm and financial advisor niche pages

### Pairing 3: Clean Contemporary
- **Headings**: `"Satoshi"` (fontshare.com, free) — geometric sans, very trendy in 2025-2026
- **Body**: `"General Sans"` (fontshare.com) or `"Inter"`
- **Why**: Satoshi has become the designer's go-to. It signals design awareness. Available
  as a variable font

### Pairing 4: Bold & Playful
- **Headings**: `"Cabinet Grotesk"` (fontshare.com) — high contrast, strong personality
- **Body**: `"Outfit"` (Google Fonts)
- **Why**: More character and personality for coaching/therapy niche pages

### Pairing 5: Luxury Professional
- **Headings**: `"Instrument Serif"` (Google Fonts) — elegant, refined
- **Body**: `"Instrument Sans"` (Google Fonts) — matching family, very cohesive
- **Why**: Serif headings convey trust and sophistication. Great for law/finance niches

### Pairing 6: Technical Precision
- **Headings**: `"Space Grotesk"` (Google Fonts) — monospaced influence, tech feel
- **Body**: `"Inter"` or `"DM Sans"`
- **Why**: For dashboard/product pages where technical precision matters

### Pairing 7: Modern Magazine
- **Headings**: `"Clash Display"` (fontshare.com) — dramatic, high-impact
- **Body**: `"General Sans"` (fontshare.com)
- **Why**: When you need maximum visual impact on landing pages

---

## Fonts to AVOID (Overused in AI Output)

| Font | Why to Avoid |
|------|-------------|
| Inter (as the only font) | Default in every framework. The #1 vibe-coding tell |
| Geist | Vercel's default. Screams "Next.js template" |
| Roboto | Google's default. Generic |
| Open Sans | 2015-era web default |
| Poppins (alone) | Massively overused in AI output since ~2023 |
| Montserrat (alone) | The "Canva template" font |
| Lato | Generic, no personality |

**Note**: Inter is fine as a BODY font when paired with a distinctive heading font. The
problem is using it as the only font for everything.

---

## Typography Scale

Use a deliberate, high-contrast type scale. Avoid the AI tendency to make everything similar
in size.

```
Hero headline:     clamp(2.5rem, 5vw + 1rem, 5rem)    // 40-80px
                   font-weight: 700-800
                   line-height: 1.05-1.15
                   letter-spacing: -0.02em to -0.04em

Section headline:  clamp(2rem, 3vw + 0.5rem, 3.5rem)  // 32-56px
                   font-weight: 600-700
                   line-height: 1.15-1.25
                   letter-spacing: -0.02em

Subsection head:   clamp(1.25rem, 2vw, 1.75rem)       // 20-28px
                   font-weight: 600
                   line-height: 1.3

Body large:        1.125rem (18px)
                   font-weight: 400
                   line-height: 1.7
                   letter-spacing: normal

Body:              1rem (16px)
                   font-weight: 400
                   line-height: 1.6

Small/caption:     0.875rem (14px)
                   font-weight: 400-500
                   line-height: 1.5
                   letter-spacing: 0.01em

Label/overline:    0.75rem (12px)
                   font-weight: 600
                   line-height: 1.4
                   letter-spacing: 0.05em-0.1em
                   text-transform: uppercase
```

---

## Typography Rules

### Headings
- **Negative letter-spacing** on large headings (-0.02em to -0.04em) — this is what makes
  them look "designed" vs. default
- **Tight line-height** (1.05-1.2) — AI defaults to 1.5 which looks loose and amateur on
  large text
- Use `text-balance` on headings for better line breaks: `text-wrap: balance`
- Max-width on heading containers: `max-w-3xl` for hero, `max-w-2xl` for sections
- Mix weights within the same heading: `<span class="font-light">Build</span> <span class="font-extrabold">Chatbots</span>`

### Body Text
- **Max 65-75 characters per line** (`max-w-prose` or `max-w-2xl`)
- Line-height 1.6-1.7 for comfortable reading
- Paragraph spacing: `space-y-4` between paragraphs
- Left-align body text — centered body text is harder to read

### Labels & Overlines
- Uppercase + wide letter-spacing for section labels
- Use brand muted color, not full black
- Small size (12-14px) — these should be subtle

### Numerical Data
- Use tabular-nums for tables and metrics: `font-variant-numeric: tabular-nums`
- Numbers in headings can be a different weight or color for emphasis
- Animated counters for statistics sections

---

## Implementation in Next.js

```tsx
// In layout.tsx — use next/font for optimization
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
// OR for fontshare fonts, use @next/font/local

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// In body: className={`${plusJakarta.variable} ${inter.variable}`}
```

```css
/* In globals.css */
@theme inline {
  --font-heading: var(--font-heading), system-ui, sans-serif;
  --font-body: var(--font-body), system-ui, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

body {
  font-family: var(--font-body);
}
```
