import os
import argparse
import subprocess
import pandas as pd


def argsparser():
    parser = argparse.ArgumentParser("Producing the predictions with a fitted pipeline")
    parser.add_argument('--gpu', help='Which gpu device to use. Empty string for CPU', type=str, default='')
    parser.add_argument('--video_path', help='The path of video file', type=str, default='datasets/demo.avi')
    parser.add_argument('--log_path', help='The path of saving logs', type=str, default='log.txt')
    parser.add_argument('--load_path', help='The path for loading the trained pipeline', type=str, default='fitted_pipeline')
   

    return parser

def preprocess_video(video_path):
    """ Chuyển đổi MP4 → AVI nếu cần, resize video về đúng định dạng """
    output_path = video_path
    if video_path.endswith(".mp4"):
        output_path = video_path.replace(".mp4", "_converted.avi")
        subprocess.run(f"ffmpeg -i {video_path} -vf 'scale=320:240,fps=30' -c:v libxvid -qscale:v 3 {output_path}", shell=True)
    return output_path

def run(args):
    # Set the logger path
    from autovideo.utils import set_log_path, logger
    set_log_path(args.log_path)

    processed_video = preprocess_video(args.video_path)
    # Load fitted pipeline
    import torch
    if torch.cuda.is_available():
        fitted_pipeline = torch.load(args.load_path, map_location="cuda:0")
    else:
        fitted_pipeline = torch.load(args.load_path, map_location="cpu")

    # Produce
    from autovideo import produce_by_path
    predictions = produce_by_path(fitted_pipeline, args.video_path)
    
    map_label = {0:'brush_hair', 1:'cartwheel', 2: 'catch', 3:'chew', 4:'clap',5:'climb'}
    out = map_label[predictions['label'][0]]
    logger.info('Detected Action: %s', out)
    return out
if __name__ == '__main__':
    parser = argsparser()
    args = parser.parse_args()
    os.environ["CUDA_VISIBLE_DEVICES"] = args.gpu

    # Produce
    result = run(args)
    print(result)

