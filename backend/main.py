import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="BugLens AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
DATA_DIR = Path("data")
FRAMES_DIR = Path("frames")
app.mount("/frames", StaticFiles(directory=FRAMES_DIR), name="frames")
REPORTS_FILE = DATA_DIR / "reports.json"
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

UPLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
FRAMES_DIR.mkdir(exist_ok=True)


def load_reports():
    if not REPORTS_FILE.exists():
        return []

    try:
        return json.loads(REPORTS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def save_reports(reports):
    REPORTS_FILE.write_text(
        json.dumps(reports, indent=2),
        encoding="utf-8",
    )

def find_report(report_id: str):
    reports = load_reports()

    for index, report in enumerate(reports):
        if report["id"] == report_id:
            return reports, index, report

    return reports, None, None

def detect_error_keywords(text: str):
    keywords = [
        "error",
        "failed",
        "exception",
        "undefined",
        "null",
        "unauthorized",
        "forbidden",
        "not found",
        "404",
        "500",
        "timeout",
        "crash",
    ]

    lower_text = text.lower()
    return [keyword for keyword in keywords if keyword in lower_text]

@app.get("/")
def root():
    return {"message": "BugLens AI backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/reports")
def get_reports():
    reports = load_reports()
    return {"reports": reports}

@app.get("/reports/{report_id}")
def get_report(report_id: str):
    _, _, report = find_report(report_id)

    if not report:
        return {"error": "Report not found"}

    return report

@app.post("/reports/{report_id}/extract-frames")
def extract_report_frames(report_id: str):
    reports, report_index, report = find_report(report_id)

    if report_index is None or report is None:
        return {"error": "Report not found"}

    video_path = UPLOAD_DIR / report["stored_filename"]

    if not video_path.exists():
        return {"error": "Uploaded video file not found"}

    report_frames_dir = FRAMES_DIR / report_id
    report_frames_dir.mkdir(exist_ok=True)

    frame_pattern = report_frames_dir / "frame_%03d.jpg"

    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-vf",
        "fps=1/2",
        "-frames:v",
        "3",
        str(frame_pattern),
    ]

    completed_process = subprocess.run(
        command,
        capture_output=True,
        text=True,
    )

    if completed_process.returncode != 0:
        return {
            "error": "Frame extraction failed",
            "details": completed_process.stderr,
        }

    frame_files = sorted(report_frames_dir.glob("*.jpg"))
    frame_paths = [str(frame_path).replace("\\", "/") for frame_path in frame_files]

    report["frames"] = frame_paths
    report["status"] = "frames_extracted"
    report["updated_at"] = datetime.now(timezone.utc).isoformat()

    reports[report_index] = report
    save_reports(reports)

    return {
        "id": report_id,
        "status": report["status"],
        "frames": frame_paths,
    }

@app.post("/reports/upload")
async def upload_report(
    title: str = Form(...),
    description: str = Form(""),
    video: UploadFile = File(...),
):
    report_id = str(uuid4())
    file_extension = Path(video.filename or "").suffix
    stored_filename = f"{report_id}{file_extension}"
    stored_path = UPLOAD_DIR / stored_filename

    contents = await video.read()
    stored_path.write_bytes(contents)

    report = {
        "id": report_id,
        "title": title,
        "description": description,
        "original_filename": video.filename,
        "stored_filename": stored_filename,
        "content_type": video.content_type,
        "size_bytes": len(contents),
        "status": "uploaded",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    reports = load_reports()
    reports.insert(0, report)
    save_reports(reports)

    return report