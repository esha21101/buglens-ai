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

type ReportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        const resolvedParams = await params;
        setReportId(resolvedParams.id);

        const response = await fetch(
          `http://localhost:8000/reports/${resolvedParams.id}`
        );

        if (!response.ok) {
          throw new Error("Could not load report.");
        }

        const data = (await response.json()) as Report | { error: string };

        if ("error" in data) {
          throw new Error(data.error);
        }

        setReport(data);
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

    loadReport();
  }, [params]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-4xl">
        <a href="/dashboard" className="text-sm font-medium text-cyan-300">
          Back to dashboard
        </a>

        {isLoading && (
          <p className="mt-8 text-sm text-slate-300">Loading report...</p>
        )}

        {error && (
          <div className="mt-8 rounded-lg border border-red-800 bg-red-950 p-5 text-red-100">
            <p className="font-semibold">Could not load report</p>
            <p className="mt-1 text-sm">{error}</p>
            {reportId && (
              <p className="mt-3 text-xs text-red-300">Report ID: {reportId}</p>
            )}
          </div>
        )}

        {report && (
          <>
            <div className="mt-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cyan-300">
                  Bug report
                </p>
                <h1 className="mt-3 text-3xl font-semibold">{report.title}</h1>
                <p className="mt-2 text-slate-300">
                  {report.description || "No description provided"}
                </p>
              </div>

              <span className="rounded-full border border-emerald-800 bg-emerald-950 px-3 py-1 text-xs font-medium text-emerald-200">
                {report.status}
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <h2 className="font-semibold">Uploaded file</h2>

                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-400">Original filename</dt>
                    <dd className="mt-1 text-slate-100">
                      {report.original_filename}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-400">Stored filename</dt>
                    <dd className="mt-1 break-all text-slate-100">
                      {report.stored_filename}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-400">File type</dt>
                    <dd className="mt-1 text-slate-100">
                      {report.content_type}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-400">Size</dt>
                    <dd className="mt-1 text-slate-100">
                      {Math.round(report.size_bytes / 1024)} KB
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <h2 className="font-semibold">AI processing</h2>

                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>Frame extraction: not started</p>
                  <p>OCR detection: not started</p>
                  <p>Bug report generation: not started</p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}