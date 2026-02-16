import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <nav className="border-b border-brand-border/50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-brand-primary"
          >
            Leadbot<span className="text-gradient">Partners</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-muted transition-colors hover:text-brand-primary"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-accent rounded-full px-5 py-2 text-sm font-semibold text-brand-primary transition-all hover:brightness-105"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6">
        <div
          className="glow-orb left-1/4 top-1/4 h-[400px] w-[400px]"
          style={{ background: "rgba(255, 215, 140, 0.2)" }}
        />

        <div className="relative text-center">
          <div className="bg-gradient-accent mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <MessageSquare className="h-7 w-7 text-brand-primary" />
          </div>
          <h1 className="mt-6 text-7xl font-bold tracking-tight text-brand-primary">
            404
          </h1>
          <p className="mt-3 text-lg font-semibold text-brand-primary">
            Page not found
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">
            Looks like this page wandered off. Even our chatbots couldn&apos;t
            find it.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="bg-gradient-accent rounded-full px-6 py-2.5 text-sm font-semibold text-brand-primary transition-all hover:brightness-105"
            >
              Back to Home
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-brand-border px-6 py-2.5 text-sm font-semibold text-brand-primary transition-all hover:border-brand-muted hover:bg-brand-surface"
            >
              Try the Demo
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border/50 bg-brand-surface">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-brand-light">
          &copy; {new Date().getFullYear()} Leadbot Partners. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
