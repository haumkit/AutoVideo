import React from 'react';

function HistorySection({
    showHistory,
    history,
    fetchVideoDetails,
    setSelectedVideo
}) {
    if (!showHistory) return null;

    const handleVideoClick = async (videoId) => {
        await fetchVideoDetails(videoId);
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '800px',
            marginTop: '20px',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ marginBottom: '20px' }}>Processing History</h2>
            {history.length === 0 ? (
                <p>No videos processed yet.</p>
            ) : (
                <div style={{
                    display: 'grid',
                    gap: '10px'
                }}>
                    {history.map((video) => (
                        <div
                            key={video._id}
                            onClick={() => handleVideoClick(video._id)}
                            style={{
                                padding: '15px',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                ':hover': {
                                    backgroundColor: '#e0e0e0'
                                }
                            }}
                        >
                            <p><strong>Filename:</strong> {video.filename}</p>
                            <p><strong>Status:</strong> {video.status}</p>
                            <p><strong>Upload Time:</strong> {new Date(video.upload_time).toLocaleString()}</p>
                            {video.action && (
                                <p><strong>Detected Action:</strong> {video.action}</p>
                            )}
                            {video.feedback && (
                                <p style={{ color: '#4CAF50' }}><strong>Feedback Provided</strong></p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default HistorySection; 