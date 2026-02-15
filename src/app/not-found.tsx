import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            LeadBotStudio
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mt-6 text-7xl font-bold tracking-tight text-gray-900">
            404
          </h1>
          <p className="mt-4 text-xl font-semibold text-gray-900">
            Page not found
          </p>
          <p className="mt-2 max-w-md text-base text-gray-600">
            Looks like this page wandered off. Even our chatbots couldn&apos;t
            find it.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/"
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Back to Home
            </Link>
            <Link
              href="/demo"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              Try the Demo
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} LeadBotStudio. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
