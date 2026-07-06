import time
import logging
import cloudinary
import cloudinary.uploader
from app.config import settings

# Configure logger
logger = logging.getLogger(__name__)

# Initialize Cloudinary configuration
if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )
else:
    logger.warning("Cloudinary credentials are not fully configured in the environment.")

class CloudinaryService:
    @staticmethod
    def upload_pdf(file_bytes: bytes, file_name: str) -> dict:
        """
        Uploads PDF bytes to Cloudinary with retry handling.
        Returns:
            dict containing secure_url, public_id, and metadata.
        """
        # Clean up file name for Cloudinary public_id (only allow alphanumeric, hyphens, and underscores)
        clean_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in file_name.rsplit(".", 1)[0])
        public_id = f"{int(time.time())}_{clean_name}"
        
        max_retries = 3
        delay = 1.0
        
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Uploading file {file_name} to Cloudinary (Attempt {attempt}/{max_retries})...")
                
                # PDFs are uploaded as raw files
                result = cloudinary.uploader.upload(
                    file_bytes,
                    resource_type="raw",
                    public_id=public_id,
                    folder="ai-learning-documents"
                )
                
                logger.info(f"Successfully uploaded {file_name} to Cloudinary. Public ID: {result.get('public_id')}")
                return {
                    "secure_url": result.get("secure_url"),
                    "public_id": result.get("public_id"),
                    "metadata": {
                        "format": result.get("format"),
                        "bytes": len(file_bytes),
                        "created_at": result.get("created_at")
                    }
                }
            except Exception as e:
                logger.error(f"Cloudinary upload failed on attempt {attempt}: {str(e)}")
                if attempt == max_retries:
                    raise Exception(f"Failed to upload to Cloudinary after {max_retries} attempts: {str(e)}")
                time.sleep(delay)
                delay *= 2.0  # Exponential backoff
                
    @staticmethod
    def delete_pdf(public_id: str) -> bool:
        """
        Deletes a raw file from Cloudinary.
        """
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type="raw")
            return result.get("result") == "ok"
        except Exception as e:
            logger.error(f"Failed to delete Cloudinary asset {public_id}: {str(e)}")
            return False
