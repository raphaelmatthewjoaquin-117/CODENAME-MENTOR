import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <div className="home-tiger-bg" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-16 h-40 w-40 rounded-full bg-gold-200/50 blur-3xl" />
        <div className="absolute right-0 top-24 h-48 w-48 rounded-full bg-navy-200/40 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between">
        <p className="text-sm font-semibold tracking-[0.2em] text-navy-600">
           PROFESSOR&apos;S DAY
        </p>
        <Link
          href="/admin"
          className="text-xs text-navy-400 transition hover:text-navy-900"
        >
          Faculty desk
        </Link>
      </header>

      <section className="relative z-10 mt-16 grid flex-1 items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-yellow-400/90 px-4 py-1 text-sm font-semibold text-navy-900 shadow-sm">
            A digital corkboard of gratitude
          </p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight text-navy-900 sm:text-6xl">
            Thank the professors who shaped this year.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-navy-600">
            Students leave a note. Professors open a private board of colorful
            sticky notes. Simple, warm, and made for  Professor&apos;s Day.
          </p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/student"
            className="group rounded-3xl bg-white/85 p-7 shadow-xl shadow-navy-900/10 ring-1 ring-navy-200 transition hover:-translate-y-1 hover:shadow-2xl"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-500">
              Student Portal
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-navy-900">
              Leave a message
            </h2>
            <p className="mt-2 text-navy-600">
              Choose a professor, write a note, and send it to the corkboard.
            </p>
            <span className="mt-6 inline-flex rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-navy-900 shadow-sm transition group-hover:bg-yellow-300">
              Open student form →
            </span>
          </Link>

          <Link
            href="/professor"
            className="group rounded-3xl bg-navy-900 p-7 text-white shadow-xl shadow-navy-900/20 transition hover:-translate-y-1"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-400">
              Professor Login
            </p>
            <h2 className="mt-3 text-2xl font-semibold">View your board</h2>
            <p className="mt-2 text-navy-200">
              Sign in with the username and password created for you.
            </p>
            <span className="mt-6 inline-flex rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-navy-900 shadow-sm transition group-hover:bg-yellow-300">
              Go to professor portal →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
