import React from 'react';

function VideoPreview({ showPreview, setShowPreview, previewVideo, setPreviewVideo, videoUrls }) {
    if (!showPreview || !previewVideo) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                textAlign: 'center',
                padding: '20px',
                borderRadius: '10px',
                maxWidth: '800px',
                width: '90%'
            }}>
                <h3 style={{ marginBottom: '15px' }}>Video Preview</h3>
                <div style={{ position: 'relative', width: '100%' }}>
                    <video
                        controls
                        style={{
                            minWidth: '100%',
                            maxWidth: '100%',
                            maxHeight: '70vh',
                            marginBottom: '15px',
                            borderRadius: '4px',
                            backgroundColor: '#000'
                        }}
                        key={videoUrls[previewVideo.name]}
                    >
                        <source
                            src={videoUrls[previewVideo.name]}
                            type={previewVideo.type || 'video/avi'}
                        />
                        Your browser does not support the video tag.
                    </video>
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '0.9em'
                    }}>
                        {previewVideo.name}
                    </div>
                </div>
                <button
                    onClick={() => {
                        setShowPreview(false);
                        setPreviewVideo(null);
                    }}
                    style={{
                        display: 'block',
                        margin: '0 auto',
                        padding: '10px 20px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
}

export default VideoPreview; 