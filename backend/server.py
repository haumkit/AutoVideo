from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import logging

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Autovideo service URL - use autovideo:9000 when running in Docker, localhost:9000 when running locally
AUTOVIDEO_URL = os.getenv("AUTOVIDEO_URL", "http://autovideo:9000")

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Forward the file to autovideo service
        async with httpx.AsyncClient() as client:
            files = {"file": (file.filename, file.file, file.content_type)}
            response = await client.post(f"{AUTOVIDEO_URL}/recogonize", files=files)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Error from autovideo service: {response.text}")
                return {"message": "Error processing video", "error": "Service unavailable"}
    except Exception as e:
        logger.error(f"Error forwarding request: {str(e)}")
        return {"message": "Error processing video", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 