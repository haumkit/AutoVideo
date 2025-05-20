import React from 'react';

function VideoDetails({
    selectedVideo,
    setSelectedVideo,
    onFeedback
}) {
    if (!selectedVideo) return null;

    const handleFeedbackClick = () => {
        if (typeof onFeedback === 'function') {
            onFeedback();
        }
    };

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
                padding: '20px',
                borderRadius: '10px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <h2 style={{ marginBottom: '20px' }}>Video Details</h2>
                <p><strong>Filename:</strong> {selectedVideo.filename}</p>
                <p><strong>Status:</strong> {selectedVideo.status}</p>
                <p><strong>Upload Time:</strong> {new Date(selectedVideo.upload_time).toLocaleString()}</p>

                {selectedVideo.action && (
                    <div>
                        <h3>Prediction Results:</h3>
                        <p><strong>Detected Action:</strong> {selectedVideo.action}</p>
                        {selectedVideo.confidence && (
                            <div style={{ marginTop: '10px' }}>
                                <p><strong>Confidence:</strong></p>
                                <div style={{
                                    width: '100%',
                                    height: '20px',
                                    backgroundColor: '#e0e0e0',
                                    borderRadius: '10px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${selectedVideo.confidence * 100}%`,
                                        height: '100%',
                                        backgroundColor: selectedVideo.confidence > 0.7 ? '#4CAF50' :
                                            selectedVideo.confidence > 0.4 ? '#FFC107' : '#F44336',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                <p style={{ textAlign: 'right', marginTop: '5px' }}>
                                    {(selectedVideo.confidence * 100).toFixed(1)}%
                                </p>
                            </div>
                        )}
                        {selectedVideo.action_details && (
                            <pre style={{
                                backgroundColor: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '5px',
                                overflowX: 'auto'
                            }}>
                                {JSON.stringify(selectedVideo.action_details, null, 2)}
                            </pre>
                        )}
                    </div>
                )}

                {selectedVideo.error && (
                    <p style={{ color: 'red' }}><strong>Error:</strong> {selectedVideo.error}</p>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    {!selectedVideo.feedback && (
                        <button
                            onClick={handleFeedbackClick}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Provide Feedback
                        </button>
                    )}
                    <button
                        onClick={() => setSelectedVideo(null)}
                        style={{
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
        </div>
    );
}

export default VideoDetails; 