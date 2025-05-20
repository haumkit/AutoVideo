import os
import logging
import subprocess
import torch
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from autovideo import produce_by_path
from autovideo.utils import set_log_path, logger

# Configure logging
set_log_path("log.txt")

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware - allow requests from be-server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000"],  # be-server URL
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

# Load fitted pipeline at startup
try:
    if torch.cuda.is_available():
        fitted_pipeline = torch.load("fitted_pipeline", map_location="cuda:0")
    else:
        fitted_pipeline = torch.load("fitted_pipeline", map_location="cpu")
    logger.info("Pipeline loaded successfully")
except Exception as e:
    logger.error(f"Error loading pipeline: {str(e)}")
    raise

def preprocess_video(video_path):
    """ Convert MP4 to AVI if needed, resize video to correct format """
    output_path = video_path
    if video_path.endswith(".mp4"):
        output_path = video_path.replace(".mp4", "_converted.avi")
        subprocess.run(f"ffmpeg -i {video_path} -vf 'scale=320:240,fps=30' -c:v libxvid -qscale:v 3 {output_path}", shell=True)
    return output_path

@app.post("/recogonize")
async def recogonize_video(file: UploadFile = File(...)):
    """
    Process video and return predictions in the format expected by be-server.
    """
    logger.info(f"Received video file: {file.filename}")
    
    # Save uploaded file temporarily
    temp_path = f"temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        logger.info(f"Saved temporary file: {temp_path}")
        
        # Preprocess video if needed
        processed_path = preprocess_video(temp_path)
        logger.info(f"Processed video saved to: {processed_path}")
        
        # Get predictions
        logger.info("Starting video recogonition...")
        predictions = produce_by_path(fitted_pipeline, processed_path)
        logger.info(f"Raw predictions: {predictions}")
            
        # Map label to action name
        map_label = {0:'brush_hair', 1:'cartwheel', 2: 'catch', 3:'chew', 4:'clap', 5:'climb'}
        action = map_label[predictions['label'][0]]
        
        response = {
            "action": action,
            "action_details": {
                "raw_prediction": str(predictions)
            },
            "confidence": float(predictions.get('confidence', 1.0))
        }
        
        logger.info(f"Formatted response: {response}")
        return response
        
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}", exc_info=True)
        raise  # Let be-server handle the error
    finally:
        # Clean up temporary files
        for path in [temp_path, temp_path.replace(".mp4", "_converted.avi")]:
            if os.path.exists(path):
                os.remove(path)
                logger.info(f"Removed temporary file: {path}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000) 