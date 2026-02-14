import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            LeadBotStudio
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/pricing"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Pricing
            </Link>
            <Link
              href="/niches/law-firm"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Industries
            </Link>
            <Link
              href="/demo"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Demo
            </Link>
          </div>
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

      {children}

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Product</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/demo"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Industries
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/niches/law-firm"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Law Firms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/niches/business-coach"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Business Coaches
                  </Link>
                </li>
                <li>
                  <Link
                    href="/niches/therapist"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Therapists
                  </Link>
                </li>
                <li>
                  <Link
                    href="/niches/real-estate"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Real Estate
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Company</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} LeadBotStudio. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
