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
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
def root():
    return {"message": "BugLens AI backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/reports/upload")
async def upload_report(
    title: str = Form(...),
    description: str = Form(""),
    video: UploadFile = File(...),
):
    file_extension = Path(video.filename or "").suffix
    stored_filename = f"{uuid4()}{file_extension}"
    stored_path = UPLOAD_DIR / stored_filename

    contents = await video.read()
    stored_path.write_bytes(contents)

    return {
        "id": stored_filename,
        "title": title,
        "description": description,
        "original_filename": video.filename,
        "stored_filename": stored_filename,
        "content_type": video.content_type,
        "size_bytes": len(contents),
        "status": "uploaded",
    }