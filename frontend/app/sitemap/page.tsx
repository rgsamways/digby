import Link from "next/link";

const sections = [
  {
    title: "Public",
    description: "Visible to everyone, no login required",
    pages: [
      { path: "/", label: "Homepage", description: "Hero, features, CTAs" },
      { path: "/sites", label: "Browse Sites", description: "Grid + map toggle, mineral filter" },
      { path: "/sites/[id]", label: "Site Detail", description: "Photos, minerals, booking form, rules", dynamic: true },
    ],
  },
  {
    title: "Auth",
    description: "Account creation and login",
    pages: [
      { path: "/login", label: "Login", description: "Email + password" },
      { path: "/register", label: "Register", description: "Visitor or operator account" },
    ],
  },
  {
    title: "Operator Portal",
    description: "For landowners and tour guides (operator role required)",
    pages: [
      { path: "/dashboard", label: "Dashboard", description: "Booking stats, revenue, recent bookings" },
      { path: "/dashboard/sites", label: "My Sites", description: "List and manage your sites" },
      { path: "/dashboard/sites/new", label: "Add Site", description: "List a new rockhound site" },
      { path: "/dashboard/stripe/complete", label: "Stripe Onboarding Complete", description: "Post-Connect redirect", todo: true },
    ],
  },
  {
    title: "Visitor",
    description: "For rockhounds (visitor role)",
    pages: [
      { path: "/bookings/[id]/confirm", label: "Booking Confirmation", description: "Post-payment success page", todo: true },
      { path: "/bookings", label: "My Bookings", description: "Booking history and status", todo: true },
    ],
  },
  {
    title: "API (Backend)",
    description: "FastAPI — view interactive docs at /docs",
    pages: [
      { path: "http://localhost:8001/docs", label: "API Docs (Swagger)", description: "All endpoints, try them live", external: true },
      { path: "/api/auth/register", label: "POST /auth/register", description: "Create account" },
      { path: "/api/auth/login", label: "POST /auth/login", description: "Get JWT token" },
      { path: "/api/auth/me", label: "GET /auth/me", description: "Current user info" },
      { path: "/api/sites", label: "GET /sites", description: "List sites with filters" },
      { path: "/api/sites/:id", label: "GET /sites/:id", description: "Single site detail", dynamic: true },
      { path: "/api/bookings", label: "POST /bookings", description: "Create booking + Stripe PaymentIntent" },
      { path: "/api/availability/:site_id", label: "GET /availability/:id", description: "Site availability calendar", dynamic: true },
      { path: "/api/payments/connect/onboard", label: "POST /payments/connect/onboard", description: "Stripe Connect for operators" },
      { path: "/api/payments/webhook", label: "POST /payments/webhook", description: "Stripe webhook handler" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-stone-900">Digby.rocks — Site Map</h1>
        <p className="mt-2 text-stone-500">Developer reference. All pages and API endpoints.</p>
      </div>

      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-4 border-b border-stone-200 pb-2">
              <h2 className="text-lg font-bold text-stone-800">{section.title}</h2>
              <p className="text-sm text-stone-500">{section.description}</p>
            </div>
            <div className="space-y-2">
              {section.pages.map((page) => (
                <div
                  key={page.path}
                  className="flex items-start gap-4 rounded-lg border border-stone-100 bg-white px-4 py-3 hover:border-stone-300 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {"external" in page && page.external ? (
                        <a
                          href={page.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-brand-600 hover:underline"
                        >
                          {page.label} ↗
                        </a>
                      ) : ("dynamic" in page && page.dynamic) || ("todo" in page && page.todo) ? (
                        <span className="font-semibold text-stone-700">{page.label}</span>
                      ) : (
                        <Link href={page.path} className="font-semibold text-brand-600 hover:underline">
                          {page.label}
                        </Link>
                      )}
                      {"todo" in page && page.todo && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          TODO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500">{page.description}</p>
                  </div>
                  <code className="shrink-0 rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                    {page.path}
                  </code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-stone-100 p-5 text-sm text-stone-600">
        <p className="font-semibold text-stone-800 mb-1">Legend</p>
        <p><span className="text-brand-600 font-medium">Linked</span> — page exists and is navigable</p>
        <p><span className="font-medium text-stone-700">Plain text</span> — dynamic route (needs an ID to link to)</p>
        <p><span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">TODO</span> — scaffolded but not yet built</p>
      </div>
    </div>
  );
}
