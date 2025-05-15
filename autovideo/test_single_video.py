import os
import pandas as pd
import torch
from autovideo.recognition.tsn_primitive import TSNPrimitive
from autovideo.recognition.eco_primitive import ECOPrimitive
from autovideo.utils import set_log_path, logger

def get_kinetics_classes():
    # Path to kinetics classes file
    kinetics_classes_path = os.path.join('autovideo', 'recognition', 'kinetics_classes.txt')
    
    # Read class names
    with open(kinetics_classes_path, 'r') as f:
        classes = [line.strip() for line in f.readlines()]
    
    return classes

def test_single_video(video_path, weights_path, model_type='tsn'):
    # Set up logging
    set_log_path('test.log')
    
    # Create a temporary CSV file with video information
    video_name = os.path.basename(video_path)
    test_data = pd.DataFrame({
        'video_id': [0],
        'video_path': [video_name],
        'label': [0]  # Dummy label, not used for prediction
    })
    
    # Save temporary CSV
    temp_csv = 'temp_test.csv'
    test_data.to_csv(temp_csv, index=False)
    
    # Get video directory
    video_dir = os.path.dirname(video_path)
    
    try:
        # Initialize model
        if model_type.lower() == 'tsn':
            model = TSNPrimitive()
        else:
            model = ECOPrimitive()
            
        # Load weights
        if torch.cuda.is_available():
            model.load_state_dict(torch.load(weights_path, map_location="cuda:0"))
        else:
            model.load_state_dict(torch.load(weights_path, map_location="cpu"))
            
        model.eval()
        
        # Make prediction
        predictions = model.produce(
            inputs=test_data,
            test_media_dir=video_dir
        )
        
        # Get prediction results
        pred_label = predictions['label'].iloc[0]
        classes = get_kinetics_classes()
        
        if 0 <= pred_label < len(classes):
            logger.info(f'Predicted class for video {video_name}: {classes[pred_label]}')
        else:
            logger.info(f'Invalid prediction ID: {pred_label}')
        
        return pred_label
        
    finally:
        # Clean up temporary CSV
        if os.path.exists(temp_csv):
            os.remove(temp_csv)

if __name__ == "__main__":
    # Example usage
    video_path = "uploads/test.mp4"  # Replace with your video path
    
    # Test with TSN model
    tsn_weights = "weights/tsn2d_kinetics400_rgb_r50_seg3_f1s1-b702e12f.pth"
    test_single_video(video_path, tsn_weights, model_type='tsn')
    
    # Test with ECO model
    eco_weights = "weights/bninception_rgb_kinetics_init-d4ee618d3399.pth"
    test_single_video(video_path, eco_weights, model_type='eco') 