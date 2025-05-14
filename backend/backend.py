from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import shutil
import logging

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Cho phép frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    try:
        # Gửi file tới autovideo qua API
        with open(file_path, "rb") as f:
            response = requests.post(
                "http://autovideo:9000/recogonize",
                files={"file": (file.filename, f)},
                data={"video_path": file_path, "log_path": "/app/autovideo/log.txt"}
            )
        if response.status_code != 200:
            logger.error(f"Error processing video: {response.text}")
            return {"message": "Error processing video", "error": response.text}
        return response.json()
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return {"message": "Error processing video", "error": str(e)}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)