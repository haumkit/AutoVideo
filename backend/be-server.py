from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json
import asyncio
from typing import List
from pydantic import BaseModel
import subprocess
import requests

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB Atlas connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://huvdev:meqeT3tEs7LiIv0J@cluster0.cncfxde.mongodb.net/")
client = AsyncIOMotorClient(MONGODB_URL)
db = client.autovideo
videos_collection = db.videos
feedback_collection = db.feedback

# Autovideo server URL
AUTOVIDEO_SERVER_URL = os.getenv("AUTOVIDEO_SERVER_URL", "http://localhost:9000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Thư mục upload và normalized
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
NORMALIZED_DIR = os.path.join(BASE_DIR, "normalized")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(NORMALIZED_DIR, exist_ok=True)

class FeedbackModel(BaseModel):
    video_id: str
    correct_action: str
    comment: str = None

def normalize_video(input_path: str, output_path: str) -> dict:
    """
    Chuẩn hóa video theo định dạng training data:
    - Định dạng: AVI
    - FPS: 30
    - Frame height: 240
    - Frame width: giữ tỉ lệ khung hình
    - Codec: XVID
    """
    try:
        logger.info(f"Starting video normalization: {input_path}")
        
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input video not found: {input_path}")

        # Lấy thông tin video gốc bằng FFMPEG
        probe_cmd = [
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=width,height,r_frame_rate,duration',
            '-of', 'json',
            input_path
        ]
        
        probe_result = subprocess.run(probe_cmd, capture_output=True, text=True)
        if probe_result.returncode != 0:
            raise Exception(f"Failed to probe video: {probe_result.stderr}")
            
        video_info = json.loads(probe_result.stdout)
        stream = video_info['streams'][0]
        
        width = int(stream['width'])
        height = int(stream['height'])
        fps_parts = stream['r_frame_rate'].split('/')
        fps = float(fps_parts[0]) / float(fps_parts[1])
        duration = float(stream.get('duration', 0))
        
        aspect_ratio = width / height
        new_width = int(240 * aspect_ratio)
        logger.info(f"New dimensions: width={new_width}, height=240")
        
        if not output_path.endswith('.avi'):
            output_path = output_path.replace('.mp4', '.avi')
        
        ffmpeg_cmd = [
            'ffmpeg',
            '-i', input_path,
            '-vf', f'scale={new_width}:240',
            '-r', '30',
            '-c:v', 'libxvid',
            '-q:v', '2',
            '-pix_fmt', 'yuv420p',
            '-y',
            output_path
        ]
        
        result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise Exception(f"FFMPEG error: {result.stderr}")
            
        logger.info(f"Video normalization completed: {output_path}")
        
        return {
            "success": True,
            "original_info": {
                "fps": fps,
                "size": (width, height),
                "duration": duration,
                "format": os.path.splitext(input_path)[1][1:].upper()
            },
            "normalized_info": {
                "fps": 30,
                "size": (new_width, 240),
                "format": "AVI",
                "codec": "XVID",
                "aspect_ratio": aspect_ratio
            }
        }
    except Exception as e:
        logger.error(f"Error normalizing video: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }

async def process_single_video(file: UploadFile) -> dict:
    try:
        safe_filename = file.filename.replace(' ', '_')
        video_path = os.path.join(UPLOAD_DIR, safe_filename)
        
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        video_doc = {
            "filename": safe_filename,
            "content_type": file.content_type,
            "upload_time": datetime.utcnow(),
            "status": "processing"
        }
        result = await videos_collection.insert_one(video_doc)
        video_id = str(result.inserted_id)

        try:
            # Lưu file video
            with open(video_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Gửi video trực tiếp đến Autovideo server
            with open(video_path, "rb") as f:
                files = {"file": (os.path.basename(video_path), f, "video/x-msvideo")}
                response = requests.post(f"{AUTOVIDEO_SERVER_URL}/recogonize", files=files)
                
            if response.status_code != 200:
                raise Exception(f"Autovideo server error: {response.text}")

            action_result = response.json()
            
            # Cập nhật kết quả vào MongoDB
            await videos_collection.update_one(
                {"_id": ObjectId(video_id)},
                {
                    "$set": {
                        "status": "completed",
                        "action": action_result.get("action"),
                        "action_details": action_result.get("action_details"),
                        "confidence": action_result.get("confidence", 0),
                        "processed_time": datetime.utcnow()
                    }
                }
            )

            return {
                "message": "Video processed successfully",
                "action": action_result.get("action"),
                "action_details": action_result.get("action_details"),
                "confidence": action_result.get("confidence", 0),
                "video_id": video_id
            }

        except Exception as e:
            logger.error(f"Error processing video: {str(e)}")
            
            await videos_collection.update_one(
                {"_id": ObjectId(video_id)},
                {
                    "$set": {
                        "status": "error",
                        "error": str(e),
                        "processed_time": datetime.utcnow()
                    }
                }
            )

            return {"message": "Error processing video", "error": str(e)}
            
    except Exception as e:
        logger.error(f"Error in process_single_video: {str(e)}")
        return {"message": "Error processing video", "error": str(e)}

@app.post("/recogonize")
async def recognize_video(file: UploadFile = File(...)):
    return await process_single_video(file)

@app.post("/recogonize-batch")
async def recognize_batch(files: List[UploadFile] = File(...)):
    tasks = [process_single_video(file) for file in files]
    results = await asyncio.gather(*tasks)
    return results

@app.post("/feedback")
async def submit_feedback(feedback: FeedbackModel):
    try:
        video = await videos_collection.find_one({"_id": ObjectId(feedback.video_id)})
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        feedback_doc = {
            "video_id": feedback.video_id,
            "original_action": video.get("action"),
            "correct_action": feedback.correct_action,
            "comment": feedback.comment,
            "timestamp": datetime.utcnow()
        }
        await feedback_collection.insert_one(feedback_doc)

        await videos_collection.update_one(
            {"_id": ObjectId(feedback.video_id)},
            {
                "$set": {
                    "has_feedback": True,
                    "feedback_action": feedback.correct_action
                }
            }
        )

        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/videos")
async def get_videos():
    videos = []
    async for video in videos_collection.find().sort("upload_time", -1):
        video["_id"] = str(video["_id"])
        videos.append(video)
    return videos

@app.get("/videos/{video_id}")
async def get_video(video_id: str):
    video = await videos_collection.find_one({"_id": ObjectId(video_id)})
    if video:
        video["_id"] = str(video["_id"])
        return video
    return {"message": "Video not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 