"use client";

import Link from "next/link";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

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

  function formatFileSize(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}


  function getStatusLabel(status: string) {
  switch (status) {
    case "uploaded":
      return "Uploaded";

    case "frames_extracted":
      return "Frames Extracted";

    case "text_extracted":
      return "OCR Complete";

    case "report_generated":
      return "AI Report Ready";

    default:
      return status;
  }
}

  const filteredReports = reports
  .filter((report) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      report.title.toLowerCase().includes(search) ||
      report.description.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      report.status === statusFilter;

    return matchesSearch && matchesStatus;
  })
  .sort((a, b) => {
    if (sortOrder === "newest") {
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    }

    return (
      new Date(a.created_at).getTime() -
      new Date(b.created_at).getTime()
    );
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/" className="text-sm font-medium text-cyan-300">
              BugLens AI
            </Link>
            <h1 className="mt-6 text-3xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-slate-300">
              Track uploaded bug recordings and report status.
            </p>
          </div>

          <Link
  href="/reports/new"
  className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
>
  New report
</Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
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
  <p className="text-sm text-slate-400">OCR Complete</p>
  <p className="mt-2 text-3xl font-semibold">
    {
      reports.filter(
        (report) => report.status === "text_extracted"
      ).length
    }
  </p>
</div>

      <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
  <p className="text-sm text-slate-400">AI Reports</p>
  <p className="mt-2 text-3xl font-semibold">
    {
      reports.filter(
        (report) => report.status === "report_generated"
      ).length
    }
  </p>
</div>

</div>
      <div className="mt-8 flex gap-4">
  <input
    type="text"
    placeholder="Search reports..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
  />

  <select
    value={statusFilter}
    onChange={(event) => setStatusFilter(event.target.value)}
    className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
  >
    <option value="all">All</option>
    <option value="uploaded">Uploaded</option>
    <option value="frames_extracted">Frames Extracted</option>
    <option value="text_extracted">Text Extracted</option>
    <option value="report_generated">Report Generated</option>
  </select>

  <select
  value={sortOrder}
  onChange={(event) => setSortOrder(event.target.value)}
  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
>
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
</select>

</div>



        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold">Recent reports</h2>
          </div>

        {isLoading && (
  <div className="space-y-4 p-5">
    {[1, 2, 3].map((item) => (
      <div
        key={item}
        className="animate-pulse rounded-lg border border-slate-800 p-4"
      >
        <div className="h-5 w-1/3 rounded bg-slate-700"></div>

        <div className="mt-3 h-4 w-2/3 rounded bg-slate-800"></div>

        <div className="mt-2 h-4 w-1/2 rounded bg-slate-800"></div>
      </div>
    ))}
  </div>
)}

          {error && (
            <p className="px-5 py-6 text-sm text-red-300">{error}</p>
          )}

          {!isLoading && !error && filteredReports.length === 0 && (
  <div className="px-5 py-16 text-center">
    <div className="text-5xl">🐞</div>

    <p className="mt-4 text-lg font-semibold">
      No bug reports yet
    </p>

    <p className="mt-2 text-sm text-slate-400">
      Upload your first screen recording and let BugLens AI
      extract frames, detect errors, and generate bug reports.
    </p>

    <Link
      href="/reports/new"
      className="mt-6 inline-block rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
    >
      Upload First Report
    </Link>
  </div>
)}

          {!isLoading && !error && reports.length > 0 && (
            <div className="divide-y divide-slate-800">
              {filteredReports.map((report) => (
                <Link
  key={report.id}
  href={`/reports/${report.id}`}
  className="grid gap-3 px-5 py-4 transition-all duration-200 hover:bg-slate-800/60 hover:scale-[1.01] md:grid-cols-[1fr_auto]"
>
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {report.description || "No description provided"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
  📄 {report.original_filename}
</p>

<p className="mt-1 text-xs text-slate-500">
  💾 {formatFileSize(report.size_bytes)}
</p>

<p className="mt-1 text-xs text-slate-500">
  📅 {formatDate(report.created_at)}
</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
  className={`rounded-full border px-3 py-1 text-xs font-medium ${
    report.status === "uploaded"
      ? "border-blue-800 bg-blue-950 text-blue-200"
      : report.status === "frames_extracted"
      ? "border-yellow-800 bg-yellow-950 text-yellow-200"
      : report.status === "text_extracted"
      ? "border-purple-800 bg-purple-950 text-purple-200"
      : "border-emerald-800 bg-emerald-950 text-emerald-200"
  }`}
>
  {getStatusLabel(report.status)}
</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}