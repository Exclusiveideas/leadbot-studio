"use client";

const DEMO_EMBED_CODE = process.env.NEXT_PUBLIC_DEMO_EMBED_CODE;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function DemoPage() {
  return (
    <div className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            See LeadBotStudio in Action
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Chat with our demo bot below. It&apos;s built with
            LeadBotStudio&apos;s own platform — the same tools you&apos;ll use
            to build yours.
          </p>
        </div>

        <div className="mt-16 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-6 py-3">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <span className="ml-2 text-sm text-gray-500">
              LeadBotStudio Demo
            </span>
          </div>

          {DEMO_EMBED_CODE ? (
            <iframe
              src={`${APP_URL}/chatbot/${DEMO_EMBED_CODE}`}
              className="h-[600px] w-full border-0"
              title="LeadBotStudio Demo Chatbot"
              allow="clipboard-write"
            />
          ) : (
            <div className="flex min-h-[500px] items-center justify-center p-12 text-center">
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  Demo Coming Soon
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Sign up for free and build your own chatbot in 5 minutes.
                </p>
                <a
                  href="/signup"
                  className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Try It Free
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">5-Minute Setup</h3>
            <p className="mt-2 text-sm text-gray-600">
              Choose your industry, upload content, and embed. No coding required.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">Industry-Specific</h3>
            <p className="mt-2 text-sm text-gray-600">
              Pre-built templates for law firms, coaches, therapists, real estate, and more.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">Lead Capture Built-In</h3>
            <p className="mt-2 text-sm text-gray-600">
              Dynamic forms, booking wizard, and email notifications — all included.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
