import json
import subprocess
import os

import pytesseract
import google.generativeai as genai
from dotenv import load_dotenv

from PIL import Image

from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import SessionLocal
from models import Report

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

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

UPLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
FRAMES_DIR.mkdir(exist_ok=True)

app.mount("/frames", StaticFiles(directory=FRAMES_DIR), name="frames")

REPORTS_FILE = DATA_DIR / "reports.json"

if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = (
        r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    )


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
    db = SessionLocal()

    try:
        reports = db.query(Report).all()

        return {
            "reports": [
                {
                    "id": report.id,
                    "title": report.title,
                    "description": report.description,
                    "original_filename": report.original_filename,
                    "stored_filename": report.stored_filename,
                    "content_type": report.content_type,
                    "size_bytes": report.size_bytes,
                    "status": report.status,
                    "created_at": report.created_at,
                }
                for report in reports
            ]
        }

    finally:
        db.close()

@app.get("/reports/{report_id}")
def get_report(report_id: str):
    db = SessionLocal()

    try:
        report = (
            db.query(Report)
            .filter(Report.id == report_id)
            .first()
        )

        if not report:
            return {"error": "Report not found"}

        return {
            "id": report.id,
            "title": report.title,
            "description": report.description,
            "original_filename": report.original_filename,
            "stored_filename": report.stored_filename,
            "content_type": report.content_type,
            "size_bytes": report.size_bytes,
            "status": report.status,
            "created_at": report.created_at,
            "updated_at": report.updated_at,
            "frames": report.frames,
            "ocr_text": report.ocr_text,
            "detected_keywords": report.detected_keywords,
            "ai_report": report.ai_report,
        }

    finally:
        db.close()

@app.post("/reports/{report_id}/extract-frames")
def extract_report_frames(report_id: str):
    db = SessionLocal()

    try:
        report = (
            db.query(Report)
            .filter(Report.id == report_id)
            .first()
        )

        if not report:
            return {"error": "Report not found"}

        video_path = UPLOAD_DIR / report.stored_filename

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

        frame_paths = [
            str(frame_path).replace("\\", "/")
            for frame_path in frame_files
        ]

        report.frames = json.dumps(frame_paths)
        report.status = "frames_extracted"
        report.updated_at = datetime.now(
            timezone.utc
        ).isoformat()

        db.commit()

        return {
            "id": report_id,
            "status": report.status,
            "frames": frame_paths,
        }

    finally:
        db.close()
    
@app.post("/reports/{report_id}/extract-text")
def extract_text(report_id: str):
    db = SessionLocal()

    try:
        report = (
            db.query(Report)
            .filter(Report.id == report_id)
            .first()
        )

        if not report:
            return {"error": "Report not found"}

        frame_paths = report.frames

        if not frame_paths:
            return {"error": "No extracted frames found"}

        extracted_text = []
        detected_keywords = []

        for frame_path in frame_paths:
            image = Image.open(frame_path)

            text = pytesseract.image_to_string(image)

            extracted_text.append(
                {
                    "frame": frame_path,
                    "text": text.strip(),
                }
            )

            detected_keywords.extend(
                detect_error_keywords(text)
            )

        report.ocr_text = json.dumps(extracted_text)
        report.detected_keywords = json.dumps(
            list(set(detected_keywords))
        )
        report.status = "text_extracted"
        report.updated_at = datetime.now(timezone.utc)

        db.commit()

        return {
            "id": report_id,
            "status": report.status,
            "ocr_text": extracted_text,
            "detected_keywords": list(set(detected_keywords)),
        }

    finally:
        db.close()
    
@app.post("/reports/{report_id}/generate-report")
def generate_report(report_id: str):
    db = SessionLocal()

    try:
        report = (
            db.query(Report)
            .filter(Report.id == report_id)
            .first()
        )

        if not report:
            return {"error": "Report not found"}

        ocr_text = report.ocr_text

        if not ocr_text:
            return {"error": "No OCR text found. Run OCR first."}

        unique_texts = []

        for item in ocr_text:
            text = item.get("text", "").strip()

            if text and text not in unique_texts:
                unique_texts.append(text)

        combined_text = "\n\n".join(unique_texts)

        prompt = f"""
You are a software QA engineer.

Analyze the following OCR text extracted from a screen recording.

OCR TEXT:
{combined_text}

Generate a bug report in this exact format:

Title:
Severity:
Root Cause:
Expected Behavior:
Actual Behavior:
Steps To Reproduce:
"""

        model = genai.GenerativeModel("gemini-2.5-flash")

        response = model.generate_content(prompt)

        report.ai_report = response.text
        report.status = "report_generated"
        report.updated_at = datetime.now(timezone.utc)

        db.commit()

        return {
            "status": report.status,
            "ai_report": report.ai_report,
        }

    finally:
        db.close()
        
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

    db = SessionLocal()

    try:
        db_report = Report(
            id=report["id"],
            title=report["title"],
            description=report["description"],
            original_filename=report["original_filename"],
            stored_filename=report["stored_filename"],
            content_type=report["content_type"],
            size_bytes=report["size_bytes"],
            status=report["status"],
            created_at=report["created_at"],
        )

        db.add(db_report)
        db.commit()

    finally:
        db.close()

    return report