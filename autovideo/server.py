from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from examples.recogonize import run, argsparser
import argparse
import logging
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json
import asyncio
from typing import List
from pydantic import BaseModel
import cv2
import numpy as np
from moviepy.editor import VideoFileClip

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB Atlas connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://huvdev:meqeT3tEs7LiIv0J@cluster0.cncfxde.mongodb.net/")
client = AsyncIOMotorClient(MONGODB_URL)
db = client.autovideo
videos_collection = db.videos
feedback_collection = db.feedback

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/app/autovideo/uploads"
NORMALIZED_DIR = "/app/autovideo/normalized"
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
        # Đọc video gốc
        video = VideoFileClip(input_path)
        
        # Lấy thông tin video
        original_info = {
            "fps": video.fps,
            "size": video.size,
            "duration": video.duration,
            "format": os.path.splitext(input_path)[1][1:].upper()
        }
        
        # Tính toán width mới dựa trên height 240 và giữ tỉ lệ khung hình
        aspect_ratio = video.size[0] / video.size[1]
        new_width = int(240 * aspect_ratio)
        
        # Chuẩn hóa video
        normalized = video.resize((new_width, 240))
        normalized = normalized.set_fps(30)
        
        # Lưu video đã chuẩn hóa
        normalized.write_videofile(
            output_path,
            codec='libxvid',
            fps=30,
            preset='medium',
            audio=False,
            ffmpeg_params=['-q:v', '2']  # Chất lượng video tốt
        )
        
        # Đóng video
        video.close()
        normalized.close()
        
        return {
            "success": True,
            "original_info": original_info,
            "normalized_info": {
                "fps": 30,
                "size": (new_width, 240),
                "format": "AVI",
                "codec": "XVID",
                "aspect_ratio": aspect_ratio
            }
        }
    except Exception as e:
        logger.error(f"Error normalizing video: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

async def process_single_video(file: UploadFile) -> dict:
    video_path = os.path.join(UPLOAD_DIR, file.filename)
    normalized_path = os.path.join(NORMALIZED_DIR, f"normalized_{file.filename}")
    
    # Lưu thông tin video vào MongoDB
    video_doc = {
        "filename": file.filename,
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

        # Chuẩn hóa video
        normalization_result = normalize_video(video_path, normalized_path)
        if not normalization_result["success"]:
            raise Exception(f"Failed to normalize video: {normalization_result['error']}")

        # Cập nhật thông tin video trong MongoDB
        await videos_collection.update_one(
            {"_id": ObjectId(video_id)},
            {
                "$set": {
                    "original_info": normalization_result["original_info"],
                    "normalized_info": normalization_result["normalized_info"]
                }
            }
        )

        # Xử lý video đã chuẩn hóa
        parser = argsparser()
        args = parser.parse_args([])
        args.load_path = "/app/autovideo/fitted_pipeline"
        args.video_path = normalized_path
        args.log_path = "/app/autovideo/log.txt"
        args.gpu = ""

        # Chạy nhận dạng và lấy kết quả chi tiết
        action_result = run(args)
        
        # Parse kết quả chi tiết nếu có
        try:
            if isinstance(action_result, str):
                action_details = json.loads(action_result)
            else:
                action_details = action_result
        except:
            action_details = {"action": action_result}

        # Cập nhật kết quả vào MongoDB
        await videos_collection.update_one(
            {"_id": ObjectId(video_id)},
            {
                "$set": {
                    "status": "completed",
                    "action": action_details.get("action", action_result),
                    "action_details": action_details,
                    "confidence": action_details.get("confidence", 0),
                    "processed_time": datetime.utcnow()
                }
            }
        )

        # Clean up
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(normalized_path):
            os.remove(normalized_path)

        return {
            "message": "Video processed successfully",
            "action": action_details.get("action", action_result),
            "action_details": action_details,
            "confidence": action_details.get("confidence", 0),
            "video_id": video_id,
            "normalization": normalization_result
        }

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        
        # Cập nhật trạng thái lỗi vào MongoDB
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

        # Clean up
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(normalized_path):
            os.remove(normalized_path)

        return {"message": "Error processing video", "error": str(e)}

@app.post("/recogonize")
async def recogonize_video(file: UploadFile = File(...)):
    return await process_single_video(file)

@app.post("/recogonize-batch")
async def recogonize_batch(files: List[UploadFile] = File(...)):
    """Xử lý nhiều video cùng lúc"""
    tasks = [process_single_video(file) for file in files]
    results = await asyncio.gather(*tasks)
    return results

@app.post("/feedback")
async def submit_feedback(feedback: FeedbackModel):
    """Gửi feedback về kết quả nhận dạng"""
    try:
        # Kiểm tra video có tồn tại
        video = await videos_collection.find_one({"_id": ObjectId(feedback.video_id)})
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        # Lưu feedback
        feedback_doc = {
            "video_id": feedback.video_id,
            "original_action": video.get("action"),
            "correct_action": feedback.correct_action,
            "comment": feedback.comment,
            "timestamp": datetime.utcnow()
        }
        await feedback_collection.insert_one(feedback_doc)

        # Cập nhật trạng thái video
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
    """Lấy danh sách các video đã xử lý"""
    videos = []
    async for video in videos_collection.find().sort("upload_time", -1):
        video["_id"] = str(video["_id"])
        videos.append(video)
    return videos

@app.get("/videos/{video_id}")
async def get_video(video_id: str):
    """Lấy thông tin chi tiết của một video"""
    video = await videos_collection.find_one({"_id": ObjectId(video_id)})
    if video:
        video["_id"] = str(video["_id"])
        return video
    return {"message": "Video not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)