"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UploadResult = {
  id: string;
  status: string;
};

export default function NewReportPage() {

  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a bug title.");
      return;
    }

    if (!video) {
      setError("Please select a screen recording.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("video", video);

    try {
      setIsUploading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed. Please try again.");
      }

      const data = (await response.json()) as UploadResult;

router.push(`/reports/${data.id}`);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Something went wrong."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-cyan-300">
  BugLens AI
</Link>

        <h1 className="mt-6 text-3xl font-semibold">Create Bug Report</h1>
        <p className="mt-2 text-slate-300">
          Upload a short screen recording and add basic context.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-lg border border-slate-800 bg-slate-900 p-6"
        >
          <label className="block text-sm font-medium text-slate-200">
            Bug title
          </label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
            placeholder="Example: Login button does not respond"
          />

          <label className="mt-5 block text-sm font-medium text-slate-200">
            Short description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 min-h-32 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-400"
            placeholder="Describe what happened..."
          />

          <label className="mt-5 block text-sm font-medium text-slate-200">
            Screen recording
          </label>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(event) => setVideo(event.target.files?.[0] ?? null)}
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
          />

          {error && (
            <p className="mt-4 rounded-md border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}


          <button
            disabled={isUploading}
            className="mt-5 rounded-md bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {
isUploading
? "Processing recording..."
: "Upload recording"
}
          </button>
        </form>
      </section>
    </main>
  );
}