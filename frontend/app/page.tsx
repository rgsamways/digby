import Link from "next/link";
import { MapPin, Building2, Calendar } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-stone-800 to-stone-900 px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-400">
            Bancroft, Ontario & Beyond
          </p>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight">
            Find your next{" "}
            <span className="text-brand-400">rockhound adventure</span>
          </h1>
          <p className="mb-10 text-xl text-stone-300">
            Book pay-to-dig sites, guided mineral tours, and collecting walks across
            Ontario — Canada's mineral heartland.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/sites" className="btn-primary text-base px-6 py-3">
              Browse Sites
            </Link>
            <Link href="/register?role=operator" className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-transparent px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors">
              List Your Site
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: MapPin,
              title: "Discover Sites",
              body: "Interactive map of bookable mineral sites. Filter by species, site type, and proximity.",
            },
            {
              icon: Calendar,
              title: "Book Instantly",
              body: "Real-time availability, instant confirmation, and secure payments via Stripe.",
            },
            {
              icon: Building2,
              title: "Operators Welcome",
              body: "Landowners and tour guides list sites in minutes and manage bookings in one place.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <div className="mb-4 inline-flex rounded-lg bg-brand-100 p-3">
                <Icon className="h-6 w-6 text-brand-700" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-stone-900">{title}</h3>
              <p className="text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-8 text-center text-sm text-stone-500">
        <p>© {new Date().getFullYear()} Digby.rocks — Mineral Capital of Canada</p>
      </footer>
    </div>
  );
}
