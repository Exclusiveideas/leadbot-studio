"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-brand-primary"
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
              className="bg-gradient-accent rounded-full px-4 py-2 text-xs font-semibold text-brand-primary shadow-sm transition-all hover:shadow-md hover:brightness-105 sm:px-5 sm:text-sm"
            >
              <span className="sm:hidden">Start Free</span>
              <span className="hidden sm:inline">Get Started Free</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-2 text-brand-muted md:hidden"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-brand-border/50 bg-white px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-brand-muted transition-colors hover:text-brand-primary"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-brand-muted transition-colors hover:text-brand-primary"
              >
                Log in
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-[65px]" />

      {children}

      {/* Footer */}
      <footer className="bg-brand-primary text-white">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
          <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link
                href="/"
                className="text-lg font-semibold tracking-tight"
              >
                LeadBot<span className="text-gradient">Studio</span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                AI chatbots that convert visitors into leads. Built for service
                professionals.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Product
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/demo"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Industries
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link
                    href="/niches/law-firm"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Law Firms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/niches/business-coach"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Business Coaches
                  </Link>
                </li>
                <li>
                  <Link
                    href="/niches/therapist"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Therapists
                  </Link>
                </li>
                <li>
                  <Link
                    href="/niches/real-estate"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Real Estate
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Company
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 text-center text-xs text-white/30">
            &copy; {new Date().getFullYear()} LeadBotStudio. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
