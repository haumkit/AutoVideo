from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from examples.recogonize import run, argsparser
import argparse
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

UPLOAD_DIR = "/app/autovideo/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/recogonize")
async def recogonize_video(file: UploadFile = File(...)):
    video_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create args object using argparse
    parser = argsparser()
    args = parser.parse_args([])  # Parse empty list to get default values
    args.load_path = "/app/autovideo/fitted_pipeline"
    args.video_path = video_path
    args.log_path = "/app/autovideo/log.txt"
    args.gpu = ""

    try:
        result = run(args)
        # Clean up
        if os.path.exists(video_path):
            os.remove(video_path)
        return {"message": "Video processed successfully", "action": result}
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        # Clean up
        if os.path.exists(video_path):
            os.remove(video_path)
        return {"message": "Error processing video", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)