import React, { useState, useRef, useEffect } from 'react';

const VideoPreview = ({ videoUrl }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoFormat, setVideoFormat] = useState('');
    const videoRef = useRef(null);

    useEffect(() => {
        // Xác định định dạng video từ URL
        const format = videoUrl.toLowerCase().endsWith('.avi') ? 'video/x-msvideo' : 'video/mp4';
        setVideoFormat(format);
    }, [videoUrl]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="video-preview">
            <video
                ref={videoRef}
                controls
                className="w-full h-auto"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            >
                <source src={videoUrl} type={videoFormat} />
                Your browser does not support the video tag.
            </video>
            <div className="mt-2 flex justify-center">
                <button
                    onClick={handlePlayPause}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
            </div>
            {videoFormat === 'video/x-msvideo' && (
                <div className="mt-2 text-yellow-600 text-center">
                    Note: AVI format may not be supported by all browsers.
                    Consider converting to MP4 for better compatibility.
                </div>
            )}
        </div>
    );
};

export default VideoPreview; 