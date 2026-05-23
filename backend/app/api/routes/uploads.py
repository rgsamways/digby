import uuid
from typing import Annotated

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILES = 8
MAX_SIZE_MB = 10


def _s3_client():
    return boto3.client(
        "s3",
        region_name=settings.AWS_S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


@router.post("/images")
async def upload_images(
    files: Annotated[list[UploadFile], File()],
    user: User = Depends(get_current_user),
) -> dict:
    if not settings.AWS_S3_BUCKET:
        raise HTTPException(503, "File storage not configured")
    if len(files) > MAX_FILES:
        raise HTTPException(400, f"Maximum {MAX_FILES} files per upload")

    urls: list[str] = []
    s3 = _s3_client()

    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            raise HTTPException(415, f"Unsupported file type: {file.content_type}")

        data = await file.read()
        if len(data) > MAX_SIZE_MB * 1024 * 1024:
            raise HTTPException(413, f"File exceeds {MAX_SIZE_MB} MB limit")

        ext = (file.filename or "image").rsplit(".", 1)[-1].lower()
        if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
            ext = "jpg"
        key = f"uploads/{user.id}/{uuid.uuid4()}.{ext}"

        try:
            s3.put_object(
                Bucket=settings.AWS_S3_BUCKET,
                Key=key,
                Body=data,
                ContentType=file.content_type or "image/jpeg",
            )
        except (BotoCoreError, ClientError) as e:
            raise HTTPException(502, f"Upload failed: {e}") from e

        url = (
            f"https://{settings.AWS_S3_BUCKET}"
            f".s3.{settings.AWS_S3_REGION}.amazonaws.com/{key}"
        )
        urls.append(url)

    return {"urls": urls}
