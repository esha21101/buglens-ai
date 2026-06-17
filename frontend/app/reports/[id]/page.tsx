"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";


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
  frames?: string[];

  ocr_text?: {
    frame: string;
    text: string;
  }[];

  detected_keywords?: string[];

  ai_report?: string; 
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
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState("");

  async function loadReport(id: string) {
    const response = await fetch(`http://localhost:8000/reports/${id}`);

    if (!response.ok) {
      throw new Error("Could not load report.");
    }

    const data = (await response.json()) as Report | { error: string };

    if ("error" in data) {
      throw new Error(data.error);
    }

    setReport(data);
  }

  useEffect(() => {
    async function loadInitialReport() {
      try {
        const resolvedParams = await params;
        setReportId(resolvedParams.id);
        await loadReport(resolvedParams.id);
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

    loadInitialReport();
  }, [params]);

  async function handleExtractFrames() {
    if (!reportId) return;

    try {
      setError("");
      setIsExtracting(true);

      const response = await fetch(
        `http://localhost:8000/reports/${reportId}/extract-frames`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Frame extraction failed.");
      }

      const data = (await response.json()) as { error?: string };

      if (data.error) {
        throw new Error(data.error);
      }

      await loadReport(reportId);

      toast.success("Frames extracted successfully!");
    } catch (extractError) {
      setError(
        extractError instanceof Error
          ? extractError.message
          : "Something went wrong."
      );
      toast.error("Frame extraction failed!");
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleExtractText() {
  if (!reportId) return;

  try {
    setError("");
    setIsExtractingText(true);

    const response = await fetch(
      `http://localhost:8000/reports/${reportId}/extract-text`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error("OCR extraction failed.");
    }

    const data = (await response.json()) as { error?: string };

    if (data.error) {
      throw new Error(data.error);
    }

    await loadReport(reportId);
    toast.success("OCR completed successfully!");
  } catch (extractError) {
    setError(
      extractError instanceof Error
        ? extractError.message
        : "Something went wrong."
    );
    toast.error("OCR extraction failed!");
  } finally {
    setIsExtractingText(false);
  }
}

async function handleGenerateReport() {
  if (!reportId) return;

  try {
    setError("");
    setIsGeneratingReport(true);

    const response = await fetch(
      `http://localhost:8000/reports/${reportId}/generate-report`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error("Report generation failed.");
    }

    const data = (await response.json()) as { error?: string };

    if (data.error) {
      throw new Error(data.error);
    }

    await loadReport(reportId);
    toast.success("AI bug report generated!");
  } catch (generateError) {
    setError(
      generateError instanceof Error
        ? generateError.message
        : "Something went wrong."
    );
    toast.error("Report generation failed!");
  } finally {
    setIsGeneratingReport(false);
  }
}


function getSeverityColor(reportText: string) {
  const severityMatch = reportText.match(
    /\*?\*?Severity:\*?\*?\s*(.*)/i
  );

  const severity = severityMatch?.[1]?.trim().toLowerCase() || "";

  if (severity.includes("critical")) {
    return "bg-red-600 text-white";
  }

  if (severity.includes("high")) {
    return "bg-orange-500 text-white";
  }

  if (severity.includes("medium")) {
    return "bg-yellow-500 text-black";
  }

  if (severity.includes("low")) {
    return "bg-green-600 text-white";
  }

  return "bg-slate-600 text-white";
}

function downloadReport() {
  if (!report?.ai_report) return;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("BugLens AI Report", 20, 20);

  doc.setFontSize(12);

  const lines = doc.splitTextToSize(
    report.ai_report,
    170
  );

  doc.text(lines, 20, 35);

  doc.save(`bug-report-${report.id}.pdf`);
}


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
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-sm">{error}</p>
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
                <div className="flex items-center justify-between gap-4">
  <h2 className="font-semibold">AI processing</h2>

  <div className="flex gap-2">
    <button
      onClick={handleExtractFrames}
      disabled={isExtracting}
      className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isExtracting ? "Extracting..." : "Extract frames"}
    </button>

    <button
      onClick={handleExtractText}
      disabled={isExtractingText}
      className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isExtractingText ? "Extracting..." : "Extract text"}
    </button>

    <button
    onClick={handleGenerateReport}
    disabled={isGeneratingReport}
    className="rounded-md bg-purple-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {isGeneratingReport ? "Generating..." : "Generate report"}
  </button>
  </div>
</div>

                <div className="mt-6 flex items-center justify-between">

  <div className="flex flex-col items-center">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
      ✓
    </div>
    <p className="mt-2 text-xs text-slate-300">Upload</p>
  </div>

  <div className="h-1 flex-1 bg-slate-700 mx-2" />

  <div className="flex flex-col items-center">
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
        report.frames?.length
          ? "bg-emerald-500"
          : "bg-slate-700"
      }`}
    >
      ✓
    </div>
    <p className="mt-2 text-xs text-slate-300">Frames</p>
  </div>

  <div className="h-1 flex-1 bg-slate-700 mx-2" />

  <div className="flex flex-col items-center">
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
        report.ocr_text?.length
          ? "bg-emerald-500"
          : "bg-slate-700"
      }`}
    >
      ✓
    </div>
    <p className="mt-2 text-xs text-slate-300">OCR</p>
  </div>

  <div className="h-1 flex-1 bg-slate-700 mx-2" />

  <div className="flex flex-col items-center">
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
        report.ai_report
          ? "bg-emerald-500"
          : "bg-slate-700"
      }`}
    >
      ✓
    </div>
    <p className="mt-2 text-xs text-slate-300">AI Report</p>
  </div>

</div>
              </div>
            </div>

            {report.frames && report.frames.length > 0 && (
              <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-5">
                <h2 className="font-semibold">Extracted frames</h2>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {report.frames.map((frame) => (
                    <img
                      key={frame}
                      src={`http://localhost:8000/${frame}`}
                      alt="Extracted video frame"
                      className="aspect-video rounded-md border border-slate-800 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

          {report.detected_keywords &&
  report.detected_keywords.length > 0 && (
    <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-5">
      <h2 className="font-semibold">Detected Keywords</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {report.detected_keywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-300"
          >
            {keyword}
          </span>
        ))}
      </div>
    </div>
)}

          {report.ocr_text && report.ocr_text.length > 0 && (
  <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-5">
    <h2 className="font-semibold">Detected Text</h2>

    <div className="mt-4 space-y-4">
      {report.ocr_text.map((item, index) => (
        <div
          key={index}
          className="rounded-md border border-slate-800 bg-slate-950 p-4"
        >
          <p className="text-sm font-semibold text-cyan-300">
            Frame {index + 1}
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
            {item.text || "No text detected"}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

{report.ai_report && (
  <div className="mt-8 rounded-lg border border-purple-800 bg-slate-900 p-5">
    <div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <h2 className="font-semibold text-purple-300">
      AI Generated Bug Report
    </h2>

    <button
      onClick={downloadReport}
      className="rounded-md bg-cyan-500 px-3 py-1 text-xs font-semibold text-white"
    >
      Download
    </button>
  </div>

  <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${getSeverityColor(
          report.ai_report
        )}`}
      >
        {
  report.ai_report.match(/\*?\*?Severity:\*?\*?\s*(.*)/i)?.[1] ||
  "Unknown"
}
      </span>
    </div>

    <div className="mt-4 rounded-md bg-slate-950 p-5 text-sm text-slate-200">
  {report.ai_report.split("\n").map((line, index) => (
    <p
      key={index}
      className={`mb-3 rounded-md p-3 leading-relaxed ${
  line.includes("Severity:")
    ? "bg-yellow-950 border border-yellow-700"
    : line.includes("Root Cause:")
    ? "bg-red-950 border border-red-700"
    : line.includes("Expected Behavior:")
    ? "bg-green-950 border border-green-700"
    : line.includes("Actual Behavior:")
    ? "bg-blue-950 border border-blue-700"
    : line.includes("Steps To Reproduce:")
    ? "bg-purple-950 border border-purple-700"
    : ""
}`}
    >
      {line}
    </p>
  ))}
</div>
  </div>
)}


</>
)}
            
      </section>
    </main>
  );
}