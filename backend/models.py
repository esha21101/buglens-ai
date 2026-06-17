from sqlalchemy import Column, Text, BigInteger
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Report(Base):
    __tablename__ = "reports"

    id = Column(Text, primary_key=True)

    title = Column(Text)
    description = Column(Text)

    original_filename = Column(Text)
    stored_filename = Column(Text)

    content_type = Column(Text)

    size_bytes = Column(BigInteger)

    status = Column(Text)

    created_at = Column(Text)
    updated_at = Column(Text)

    frames = Column(Text)
    ocr_text = Column(Text)
    detected_keywords = Column(Text)

    ai_report = Column(Text)