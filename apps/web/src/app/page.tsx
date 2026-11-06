import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8 sm:px-10">
      <header className="flex items-center justify-between border-b border-stone-200 pb-5">
        <span className="text-lg font-semibold tracking-tight">MakeMyMarrige</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          Foundation
        </span>
      </header>
      <section className="flex flex-1 flex-col justify-center py-16">
        <p className="text-sm font-medium text-rose-800">Application foundation</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          MakeMyMarrige workspace
        </h1>
        <p className="mt-5 max-w-xl leading-7 text-stone-600">
          The development foundation is running.
        </p>
        <Link
          className="mt-8 w-fit rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-white"
          href="/status"
        >
          View development status
        </Link>
      </section>
      <footer className="border-t border-stone-200 pt-4 text-xs text-stone-500">
        MakeMyMarrige · Development foundation
      </footer>
    </main>
  );
}
