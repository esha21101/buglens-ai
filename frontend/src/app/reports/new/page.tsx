export default function NewReportPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold">Create Bug Report</h1>
        <p className="mt-2 text-slate-300">
          Upload flow starts here tomorrow.
        </p>

        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6">
          <label className="block text-sm font-medium text-slate-200">
            Bug title
          </label>
          <input
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none"
            placeholder="Example: Login button does not respond"
          />

          <label className="mt-5 block text-sm font-medium text-slate-200">
            Short description
          </label>
          <textarea
            className="mt-2 min-h-32 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none"
            placeholder="Describe what happened..."
          />

          <button className="mt-5 rounded-md bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950">
            Save draft
          </button>
        </div>
      </section>
    </main>
  );
}