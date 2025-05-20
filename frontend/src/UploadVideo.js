import React, { useState, useEffect } from 'react';

function UploadVideo() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [videoUrls, setVideoUrls] = useState({});
  const [history, setHistory] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [selectedVideos, setSelectedVideos] = useState(new Set());

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);

    // Create URLs for preview
    const urls = {};
    files.forEach(file => {
      urls[file.name] = URL.createObjectURL(file);
    });
    setVideoUrls(urls);

    // Reset selected videos
    setSelectedVideos(new Set());
  };

  const handleSelectVideo = (fileName) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedVideos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedVideos.size === selectedFiles.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(selectedFiles.map(file => file.name)));
    }
  };

  const handlePreview = () => {
    if (selectedVideos.size === 0) {
      setError("Please select a video to preview");
      return;
    }
    if (selectedVideos.size > 1) {
      setError("Please select only one video to preview");
      return;
    }
    const videoToPreview = selectedFiles.find(file => selectedVideos.has(file.name));
    setPreviewVideo(videoToPreview);
    setShowPreview(true);
    setError('');
  };

  const handleUpload = async () => {
    if (selectedVideos.size === 0) {
      setError("Please select at least one video to upload!");
      return;
    }

    const formData = new FormData();
    selectedFiles
      .filter(file => selectedVideos.has(file.name))
      .forEach(file => {
        formData.append("files", file);
      });

    const autovideoUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://autovideo:8000';
    try {
      const response = await fetch(`${autovideoUrl}/recogonize-batch`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data);
        setError('');
        fetchHistory();
      } else {
        setError(`${data.message}: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setError("Failed to upload videos: " + err.message);
    }
  };

  const handleFeedback = async () => {
    if (!selectedVideo || !feedbackAction) {
      setError("Please provide the correct action");
      return;
    }

    const autovideoUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://autovideo:8000';
    try {
      const response = await fetch(`${autovideoUrl}/feedback`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: selectedVideo._id,
          correct_action: feedbackAction,
          comment: feedbackComment
        })
      });

      const data = await response.json();
      if (response.ok) {
        setShowFeedback(false);
        setFeedbackAction('');
        setFeedbackComment('');
        fetchHistory();
      } else {
        setError(data.detail || "Failed to submit feedback");
      }
    } catch (err) {
      setError("Failed to submit feedback: " + err.message);
    }
  };

  const fetchHistory = async () => {
    const autovideoUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://autovideo:8000';
    try {
      const response = await fetch(`${autovideoUrl}/videos`);
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const fetchVideoDetails = async (videoId) => {
    const autovideoUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://autovideo:8000';
    try {
      const response = await fetch(`${autovideoUrl}/videos/${videoId}`);
      const data = await response.json();
      setSelectedVideo(data);
    } catch (err) {
      console.error("Failed to fetch video details:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      <h1 style={{
        fontSize: '2.5em',
        marginBottom: '40px',
        color: '#333'
      }}>
        Video Auto Recognition
      </h1>

      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            multiple
            style={{
              marginBottom: '20px',
              width: '100%',
              padding: '10px',
              border: '2px dashed #ccc',
              borderRadius: '5px'
            }}
          />
          {selectedFiles.length > 0 && (
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <div style={{
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '5px',
                marginBottom: '10px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedVideos.size === selectedFiles.length}
                    onChange={handleSelectAll}
                    style={{ marginRight: '10px' }}
                  />
                  <span>Select All</span>
                </label>
              </div>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: 'white',
                borderRadius: '5px',
                padding: '10px'
              }}>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '10px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '5px',
                      marginBottom: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVideos.has(file.name)}
                      onChange={() => handleSelectVideo(file.name)}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <span style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '0.9em'
                      }}>
                        {file.name}
                      </span>
                      <span style={{
                        fontSize: '0.8em',
                        color: '#666',
                        marginTop: '2px'
                      }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <button
            onClick={handlePreview}
            disabled={selectedVideos.size === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedVideos.size > 0 ? 'pointer' : 'not-allowed',
              opacity: selectedVideos.size > 0 ? 1 : 0.6
            }}
          >
            Preview Selected
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedVideos.size === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: selectedVideos.size > 0 ? 'pointer' : 'not-allowed',
              opacity: selectedVideos.size > 0 ? 1 : 0.6
            }}
          >
            Upload Selected
          </button>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {showHistory ? 'Hide History' : 'View History'}
        </button>

        {results.length > 0 && (
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e9',
            borderRadius: '5px',
            marginTop: '20px'
          }}>
            <h3>Processing Results:</h3>
            {results.map((result, index) => (
              <div key={index} style={{
                margin: '10px 0',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '5px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <p><strong>File:</strong> {selectedFiles[index]?.name}</p>
                <p><strong>Action:</strong> {result.action}</p>
                {result.confidence && (
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
                        width: `${result.confidence * 100}%`,
                        height: '100%',
                        backgroundColor: result.confidence > 0.7 ? '#4CAF50' :
                          result.confidence > 0.4 ? '#FFC107' : '#F44336',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <p style={{ textAlign: 'right', marginTop: '5px' }}>
                      {(result.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                {result.normalization && (
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>Video Information:</strong></p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginTop: '5px'
                    }}>
                      <div>
                        <p style={{ margin: '5px 0' }}><strong>Original:</strong></p>
                        <ul style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          fontSize: '0.9em'
                        }}>
                          <li>Format: {result.normalization.original_info.format}</li>
                          <li>FPS: {result.normalization.original_info.fps}</li>
                          <li>Size: {result.normalization.original_info.size[0]}x{result.normalization.original_info.size[1]}</li>
                          <li>Duration: {result.normalization.original_info.duration.toFixed(1)}s</li>
                        </ul>
                      </div>
                      <div>
                        <p style={{ margin: '5px 0' }}><strong>Normalized:</strong></p>
                        <ul style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          fontSize: '0.9em'
                        }}>
                          <li>Format: {result.normalization.normalized_info.format}</li>
                          <li>FPS: {result.normalization.normalized_info.fps}</li>
                          <li>Size: {result.normalization.normalized_info.size[0]}x{result.normalization.normalized_info.size[1]}</li>
                          <li>Codec: {result.normalization.normalized_info.codec}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#ffebee',
            borderRadius: '5px',
            marginTop: '20px'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewVideo && (
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
      )}

      {/* History Section */}
      {showHistory && (
        <div style={{
          backgroundColor: 'white',
          padding: '10px 30px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '600px',
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '20px' }}>History</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {history.map((video) => (
              <div
                key={video._id}
                onClick={() => fetchVideoDetails(video._id)}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              >
                <h3 style={{ margin: '0 0 10px 0' }}>{video.filename}</h3>
                <p style={{ margin: '5px 0' }}>Status: {video.status}</p>
                {video.action && <p style={{ margin: '5px 0' }}>Action: {video.action}</p>}
                {video.has_feedback && (
                  <p style={{ margin: '5px 0', color: '#4CAF50' }}>
                    Corrected Action: {video.feedback_action}
                  </p>
                )}
                <p style={{ margin: '5px 0', color: '#666' }}>
                  Uploaded: {new Date(video.upload_time).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Details Modal */}
      {selectedVideo && (
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

            {selectedVideo.original_info && (
              <div style={{ marginTop: '20px' }}>
                <h3>Video Information:</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginTop: '10px'
                }}>
                  <div>
                    <h4>Original Video</h4>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}>
                      <li><strong>Format:</strong> {selectedVideo.original_info.format}</li>
                      <li><strong>FPS:</strong> {selectedVideo.original_info.fps}</li>
                      <li><strong>Size:</strong> {selectedVideo.original_info.size[0]}x{selectedVideo.original_info.size[1]}</li>
                      <li><strong>Duration:</strong> {selectedVideo.original_info.duration.toFixed(1)}s</li>
                    </ul>
                  </div>
                  <div>
                    <h4>Normalized Video</h4>
                    <ul style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0
                    }}>
                      <li><strong>Format:</strong> {selectedVideo.normalized_info.format}</li>
                      <li><strong>FPS:</strong> {selectedVideo.normalized_info.fps}</li>
                      <li><strong>Size:</strong> {selectedVideo.normalized_info.size[0]}x{selectedVideo.normalized_info.size[1]}</li>
                      <li><strong>Codec:</strong> {selectedVideo.normalized_info.codec}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedVideo.error && (
              <p style={{ color: 'red' }}><strong>Error:</strong> {selectedVideo.error}</p>
            )}

            {!selectedVideo.has_feedback && (
              <button
                onClick={() => setShowFeedback(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}
              >
                Provide Feedback
              </button>
            )}

            <button
              onClick={() => {
                setSelectedVideo(null);
                setShowFeedback(false);
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && selectedVideo && (
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
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Provide Feedback</h2>
            <p><strong>Current Action:</strong> {selectedVideo.action}</p>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Correct Action:
              </label>
              <input
                type="text"
                value={feedbackAction}
                onChange={(e) => setFeedbackAction(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #ccc'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Comment (optional):
              </label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  minHeight: '100px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowFeedback(false);
                  setFeedbackAction('');
                  setFeedbackComment('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFeedback}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadVideo;
