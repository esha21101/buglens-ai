export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
        <p className="mb-4 text-sm font-medium text-cyan-300">BugLens AI</p>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
          Turn screen recordings into clean bug reports.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Upload a short bug recording, extract useful evidence, detect visible
          errors, and generate a structured GitHub-ready issue.
        </p>

        <div className="mt-8 flex gap-3">
          <a
            href="/reports/new"
            className="rounded-md bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Create report
          </a>

          <a
            href="/dashboard"
            className="rounded-md border border-slate-700 px-5 py-3 text-sm font-semibold text-white"
          >
            View dashboard
          </a>
        </div>
      </section>
    </main>
  );
}