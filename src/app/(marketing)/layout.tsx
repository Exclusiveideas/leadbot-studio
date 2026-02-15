"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/niches/law-firm", label: "Industries" },
  { href: "/demo", label: "Demo" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-brand-border/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-brand-primary"
          >
            LeadBot<span className="text-gradient">Studio</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-brand-muted transition-colors hover:text-brand-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-brand-muted transition-colors hover:text-brand-primary sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-accent rounded-xl px-4 py-2 text-xs font-semibold text-brand-primary shadow-sm transition-all hover:shadow-md hover:brightness-105 sm:px-5 sm:text-sm"
            >
              <span className="sm:hidden">Start Free</span>
              <span className="hidden sm:inline">Get Started Free</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-brand-surface md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu — full screen overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-[65px] z-40 bg-white md:hidden">
            <div className="flex flex-col gap-1 px-6 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-brand-primary transition-colors hover:bg-brand-surface"
                >
                  {link.label}
                  <ArrowRight className="h-4 w-4 text-brand-light" />
                </Link>
              ))}
              <div className="my-3 h-px bg-brand-border/50" />
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-brand-muted transition-colors hover:bg-brand-surface"
              >
                Log in
                <ArrowRight className="h-4 w-4 text-brand-light" />
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-gradient-accent mt-4 block rounded-xl py-3.5 text-center text-base font-semibold text-brand-primary"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-[65px]" />

      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-brand-primary text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-lg font-bold tracking-tight">
                LeadBot<span className="text-gradient">Studio</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/40">
                AI chatbots that convert visitors into leads. Built for service
                professionals.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-white/30">
                Product
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { href: "/pricing", label: "Pricing" },
                  { href: "/demo", label: "Demo" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-white/30">
                Industries
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { href: "/niches/law-firm", label: "Law Firms" },
                  { href: "/niches/business-coach", label: "Business Coaches" },
                  { href: "/niches/therapist", label: "Therapists" },
                  { href: "/niches/real-estate", label: "Real Estate" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-white/30">
                Company
              </h3>
              <ul className="mt-4 space-y-2.5">
                {[
                  { href: "/about", label: "About" },
                  { href: "/privacy", label: "Privacy" },
                  { href: "/terms", label: "Terms" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/25">
            &copy; {new Date().getFullYear()} LeadBotStudio. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
