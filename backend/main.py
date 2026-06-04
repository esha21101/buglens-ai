import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

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
REPORTS_FILE = DATA_DIR / "reports.json"

UPLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)


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