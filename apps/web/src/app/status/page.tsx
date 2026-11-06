export default function StatusPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12 sm:px-10">
      <p className="text-sm font-medium text-rose-800">Development status</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Web application is available</h1>
      <p className="mt-4 text-stone-600">
        This page reports the Next.js process only. API and worker health are exposed by their own
        operational endpoints.
      </p>
      <dl className="mt-8 grid gap-4 rounded-xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Process</dt>
          <dd className="mt-1 font-medium">Next.js web</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-stone-500">Status</dt>
          <dd className="mt-1 font-medium text-emerald-800">Available</dd>
        </div>
      </dl>
    </main>
  );
}
