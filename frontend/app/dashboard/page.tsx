"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  title: string;
  description: string;
  original_filename: string;
  stored_filename: string;
  content_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch("http://localhost:8000/reports");

        if (!response.ok) {
          throw new Error("Could not load reports.");
        }

        const data = (await response.json()) as { reports: Report[] };
        setReports(data.reports);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Something went wrong."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadReports();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <a href="/" className="text-sm font-medium text-cyan-300">
              BugLens AI
            </a>
            <h1 className="mt-6 text-3xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-slate-300">
              Track uploaded bug recordings and report status.
            </p>
          </div>

          <a
            href="/reports/new"
            className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            New report
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total reports</p>
            <p className="mt-2 text-3xl font-semibold">{reports.length}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Uploaded</p>
            <p className="mt-2 text-3xl font-semibold">
              {reports.filter((report) => report.status === "uploaded").length}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Ready for AI</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold">Recent reports</h2>
          </div>

          {isLoading && (
            <p className="px-5 py-6 text-sm text-slate-300">
              Loading reports...
            </p>
          )}

          {error && (
            <p className="px-5 py-6 text-sm text-red-300">{error}</p>
          )}

          {!isLoading && !error && reports.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="font-medium">No reports yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Upload your first bug recording to start tracking reports.
              </p>
            </div>
          )}

          {!isLoading && !error && reports.length > 0 && (
            <div className="divide-y divide-slate-800">
              {reports.map((report) => (
                <a
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="grid gap-3 px-5 py-4 transition hover:bg-slate-800/60 md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {report.description || "No description provided"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      File: {report.original_filename} ·{" "}
                      {Math.round(report.size_bytes / 1024)} KB
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-200">
                      {report.status}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}