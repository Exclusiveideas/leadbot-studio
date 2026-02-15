# GSAP Animation Patterns for LeadBotStudio

GSAP (GreenSock Animation Platform) is the gold standard for scroll-based animations,
pinned sections, and horizontal scroll effects. It creates animations that feel cinematic
and intentional — the opposite of generic fade-up-everything.

**Note**: LeadBotStudio currently uses Framer Motion. GSAP should be added for marketing
pages where scroll-driven animations are needed. Both can coexist.

---

## Installation

```bash
npm install gsap
```

GSAP's ScrollTrigger, ScrollSmoother, and other plugins are included in the main package
as of GSAP 3.12+. For commercial use, the free license covers most use cases.

---

## 1. Pinned Section Animation

A section that stays fixed while content animates within it. Perfect for feature showcases.

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function PinnedFeatureSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const sections = content.querySelectorAll(".feature-panel");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${sections.length * 100}%`,
        pin: true,
        scrub: 1,
        snap: 1 / (sections.length - 1),
        anticipatePin: 1,
      },
    });

    sections.forEach((section, i) => {
      if (i === 0) return;
      tl.fromTo(
        section,
        { yPercent: 100, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1 }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden">
      <div ref={contentRef} className="relative h-full">
        {/* Each .feature-panel is a full-screen slide */}
        <div className="feature-panel absolute inset-0 flex items-center justify-center">
          {/* Feature 1 content */}
        </div>
        <div className="feature-panel absolute inset-0 flex items-center justify-center">
          {/* Feature 2 content */}
        </div>
        <div className="feature-panel absolute inset-0 flex items-center justify-center">
          {/* Feature 3 content */}
        </div>
      </div>
    </div>
  );
}
```

---

## 2. Horizontal Scroll Section

Content scrolls horizontally while the user scrolls vertically. Great for feature showcases,
portfolio items, or timeline displays.

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const totalWidth = track.scrollWidth - container.offsetWidth;

    gsap.to(track, {
      x: -totalWidth,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${totalWidth}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={containerRef} className="relative h-screen overflow-hidden">
      <div ref={trackRef} className="flex h-full items-center gap-8 px-12">
        {/* Cards scroll horizontally */}
        <div className="w-[400px] shrink-0 rounded-2xl bg-brand-surface p-8">
          {/* Card 1 */}
        </div>
        <div className="w-[400px] shrink-0 rounded-2xl bg-brand-surface p-8">
          {/* Card 2 */}
        </div>
        <div className="w-[400px] shrink-0 rounded-2xl bg-brand-surface p-8">
          {/* Card 3 */}
        </div>
        {/* Add more cards as needed */}
      </div>
    </section>
  );
}
```

---

## 3. Scroll-Based Reveal Animations

Staggered, varied entry animations that feel choreographed — not uniform.

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollRevealSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    // Headline slides from left
    gsap.from(section.querySelector(".reveal-heading"), {
      x: -60,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    // Description fades in
    gsap.from(section.querySelector(".reveal-description"), {
      y: 30,
      opacity: 0,
      duration: 0.6,
      delay: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });

    // Cards stagger in from below
    gsap.from(section.querySelectorAll(".reveal-card"), {
      y: 60,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: "top 70%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 lg:py-32">
      <h2 className="reveal-heading text-4xl font-bold tracking-tight">
        Features
      </h2>
      <p className="reveal-description mt-4 text-lg text-brand-muted">
        Everything you need to convert visitors into leads.
      </p>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="reveal-card rounded-2xl border p-6">{/* Card */}</div>
        <div className="reveal-card rounded-2xl border p-6">{/* Card */}</div>
        <div className="reveal-card rounded-2xl border p-6">{/* Card */}</div>
      </div>
    </section>
  );
}
```

---

## 4. Parallax Background Layers

Multiple background elements moving at different speeds for depth.

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ParallaxHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    // Background layer moves slowly
    gsap.to(container.querySelector(".parallax-bg"), {
      yPercent: -20,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    // Mid layer
    gsap.to(container.querySelector(".parallax-mid"), {
      yPercent: -40,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    // Foreground moves fastest
    gsap.to(container.querySelector(".parallax-fg"), {
      yPercent: -60,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden">
      <div className="parallax-bg absolute inset-0">
        {/* Blurred gradient orbs */}
      </div>
      <div className="parallax-mid absolute inset-0">
        {/* Grid pattern or shapes */}
      </div>
      <div className="parallax-fg relative z-10 flex h-full items-center">
        {/* Actual content */}
      </div>
    </div>
  );
}
```

---

## 5. Text Reveal Animation

Characters or words animate in sequence for dramatic headlines.

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function TextReveal({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      // Show all words immediately
      container.querySelectorAll(".word").forEach((word) => {
        (word as HTMLElement).style.opacity = "1";
      });
      return;
    }

    gsap.from(container.querySelectorAll(".word"), {
      opacity: 0.1,
      stagger: 0.05,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: container,
        start: "top 80%",
        end: "top 30%",
        scrub: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [text]);

  return (
    <div ref={containerRef} className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="word inline-block mr-[0.25em]">
          {word}
        </span>
      ))}
    </div>
  );
}
```

---

## 6. Counter/Stats Animation

Numbers count up as they enter the viewport.

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obj = { val: 0 };

    gsap.to(obj, {
      val: value,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
      onUpdate: () => setDisplay(Math.round(obj.val)),
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}
```

---

## 7. Scroll Progress Indicator

A thin progress bar at the top of the page showing scroll position.

```tsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    gsap.to(bar, {
      scaleX: 1,
      transformOrigin: "left center",
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.3,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div
        ref={barRef}
        className="h-full bg-gradient-to-r from-[#ffd78c] to-[#ffab7a] scale-x-0"
      />
    </div>
  );
}
```

---

## Important GSAP Rules

### Always Clean Up
Every `useEffect` that creates GSAP animations must return a cleanup function that kills
ScrollTrigger instances. Memory leaks from un-killed ScrollTriggers cause janky scrolling.

### Always Check Reduced Motion
```ts
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
if (prefersReducedMotion) return;
```

### Use `scrub` Wisely
- `scrub: true` — animation tied directly to scroll (no smoothing)
- `scrub: 0.5` — 0.5 second catch-up (smoother)
- `scrub: 1` — 1 second catch-up (smoothest, recommended for most)

### Performance Tips
- Use `will-change: transform` on animated elements
- Prefer `transform` and `opacity` (GPU-accelerated) over `left`, `top`, `width`, `height`
- Use `gsap.set()` for initial states instead of CSS that gets overridden
- Debounce ScrollTrigger.refresh() if resizing triggers recalculation
- Avoid animating more than 30 elements simultaneously

### Mobile Considerations
- Disable or simplify pinned sections on mobile (they can feel janky)
- Reduce animation complexity: fewer stagger elements, shorter durations
- Test on real devices — mobile Safari handles scroll differently
- Consider: `ScrollTrigger.matchMedia({ "(min-width: 768px)": () => { ... } })`
