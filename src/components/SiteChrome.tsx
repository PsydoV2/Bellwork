import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M10 14 Q9 5 16 5 Q23 5 22 14" fill="none" stroke="var(--color-bell-dark)" strokeWidth="3.5" />
      <circle cx="16" cy="20" r="9" fill="var(--color-bell)" />
      <circle cx="13" cy="17" r="2.5" fill="var(--color-bell-shine)" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <Logo />
          <span>{SITE_NAME}</span>
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2 text-sm">
          <Link href="/exercises" className="hidden sm:block rounded-full px-3 py-2 text-muted hover:text-ink">
            Exercises
          </Link>
          <Link href="/#amrap" className="hidden md:block rounded-full px-3 py-2 text-muted hover:text-ink">
            AMRAP
          </Link>
          <Link href="/#faq" className="hidden md:block rounded-full px-3 py-2 text-muted hover:text-ink">
            FAQ
          </Link>
          <Link
            href="/app"
            className="rounded-full bg-accent hover:bg-accent-strong px-4 py-2 font-semibold text-black transition-colors"
          >
            Open app
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 font-bold">
            <Logo className="h-7 w-7" /> {SITE_NAME}
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Free kettlebell workout planner and timer. Exercise information is for general education – check with a
            doctor before starting a new training program and stop if anything hurts.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Train</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/app" className="hover:text-accent-strong">Workout planner</Link>
            </li>
            <li>
              <Link href="/#amrap" className="hover:text-accent-strong">AMRAP workouts</Link>
            </li>
            <li>
              <Link href="/#workouts" className="hover:text-accent-strong">Ready-made workouts</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Learn</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/exercises" className="hover:text-accent-strong">Exercise guide</Link>
            </li>
            <li>
              <Link href="/#faq" className="hover:text-accent-strong">FAQ</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
