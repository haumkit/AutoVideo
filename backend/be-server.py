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
import aiohttp
from fastapi.responses import JSONResponse
from models import Video, Feedback
from mongoengine import connect

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://huvdev:meqeT3tEs7LiIv0J@cluster0.cncfxde.mongodb.net/")
connect(host=MONGODB_URL)

# Autovideo server URL
AUTOVIDEO_SERVER_URL = os.getenv("AUTOVIDEO_SERVER_URL", "http://localhost:9000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
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
        
        # Create video document
        video = Video(
            filename=safe_filename,
            status="processing",
            upload_time=datetime.utcnow()
        )
        video.save()
        video_id = str(video.id)

        try:
            # Save video file
            with open(video_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Normalize video
            normalized_path = os.path.join(NORMALIZED_DIR, safe_filename.replace('.mp4', '.avi'))
            normalization_result = normalize_video(video_path, normalized_path)
            
            if not normalization_result["success"]:
                raise Exception(f"Video normalization failed: {normalization_result['error']}")

            # Send to Autovideo server
            with open(normalized_path, "rb") as f:
                files = {"file": (os.path.basename(normalized_path), f, "video/x-msvideo")}
                response = requests.post(f"{AUTOVIDEO_SERVER_URL}/recogonize", files=files)
                
            if response.status_code != 200:
                raise Exception(f"Autovideo server error: {response.text}")

            action_result = response.json()
            
            # Update video document
            video.status = "completed"
            video.action = action_result.get("action")
            video.action_details = action_result.get("action_details")
            video.confidence = action_result.get("confidence", 0)
            video.original_info = normalization_result["original_info"]
            video.normalized_info = normalization_result["normalized_info"]
            video.save()

            return {
                "message": "Video processed successfully",
                "filename": file.filename,
                "action": action_result.get("action"),
                "action_details": action_result.get("action_details"),
                "confidence": action_result.get("confidence", 0),
                "video_id": video_id,
                "normalization": {
                    "original_info": normalization_result["original_info"],
                    "normalized_info": normalization_result["normalized_info"]
                }
            }

        except Exception as e:
            logger.error(f"Error processing video: {str(e)}")
            
            # Update video document with error
            video.status = "error"
            video.error = str(e)
            video.save()

            return {
                "message": "Error processing video", 
                "error": str(e),
                "filename": file.filename
            }
            
    except Exception as e:
        logger.error(f"Error in process_single_video: {str(e)}")
        return {
            "message": "Error processing video", 
            "error": str(e),
            "filename": file.filename if hasattr(file, 'filename') else None
        }

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Upload video and get predictions from AV server
    """
    try:
        result = await process_single_video(file)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recogonize")
async def recognize_video(file: UploadFile = File(...)):
    return await process_single_video(file)

@app.post("/recogonize-batch")
async def recognize_batch(files: List[UploadFile] = File(...)):
    tasks = [process_single_video(file) for file in files]
    results = await asyncio.gather(*tasks)
    return results

@app.post("/feedback")
async def submit_feedback(feedback_data: FeedbackModel):
    try:
        # Get the video
        video = Video.objects.get(id=feedback_data.video_id)
        
        # Create feedback record
        feedback = Feedback(
            video=video,
            filename=video.filename,
            original_action=video.action,
            correct_action=feedback_data.correct_action,
            comment=feedback_data.comment
        )
        feedback.save()

        # Update video with feedback
        video.has_feedback = True
        video.feedback_action = feedback_data.correct_action
        video.feedback_comment = feedback_data.comment
        video.save()

        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/videos")
async def get_videos():
    """
    Get all videos with their predictions
    """
    try:
        videos = Video.objects.order_by('-upload_time')
        return [{
            "_id": str(video.id),
            "filename": video.filename,
            "status": video.status,
            "action": video.action,
            "confidence": video.confidence,
            "upload_time": video.upload_time.isoformat(),
            "has_feedback": video.has_feedback,
            "feedback_action": video.feedback_action,
            "feedback_comment": video.feedback_comment,
            "error": video.error,
            "action_details": video.action_details,
            "original_info": video.original_info,
            "normalized_info": video.normalized_info
        } for video in videos]
    except Exception as e:
        logger.error(f"Error getting videos: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/videos/{video_id}")
async def get_video(video_id: str):
    try:
        video = Video.objects.get(id=video_id)
        return {
            "_id": str(video.id),
            "filename": video.filename,
            "status": video.status,
            "action": video.action,
            "confidence": video.confidence,
            "upload_time": video.upload_time.isoformat(),
            "has_feedback": video.has_feedback,
            "feedback_action": video.feedback_action,
            "feedback_comment": video.feedback_comment,
            "error": video.error,
            "action_details": video.action_details,
            "original_info": video.original_info,
            "normalized_info": video.normalized_info
        }
    except Video.DoesNotExist:
        raise HTTPException(status_code=404, detail="Video not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 