import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import ProcessingResults from './components/ProcessingResults';
import HistorySection from './components/HistorySection';
import VideoDetails from './components/VideoDetails';
import Feedback from './components/Feedback';

function UploadVideo() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [videoUrls, setVideoUrls] = useState({});
  const [history, setHistory] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState(new Set());

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

  const handleFeedback = async (feedbackData) => {
    const autovideoUrl = window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'http://autovideo:8000';
    try {
      const response = await fetch(`${autovideoUrl}/feedback`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      const data = await response.json();
      if (response.ok) {
        setShowFeedback(false);
        setSelectedVideo(null);
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
        <FileUploader
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          selectedVideos={selectedVideos}
          setSelectedVideos={setSelectedVideos}
          videoUrls={videoUrls}
          setVideoUrls={setVideoUrls}
          handleSelectVideo={handleSelectVideo}
          handleSelectAll={handleSelectAll}
        />

        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
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
            Tải lên
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
          {showHistory ? 'Ẩn lịch sử' : 'Xem lịch sử'}
        </button>

        <ProcessingResults
          results={results}
          selectedFiles={selectedFiles}
          onFeedback={handleFeedback}
        />

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

      <HistorySection
        showHistory={showHistory}
        history={history}
        fetchVideoDetails={fetchVideoDetails}
        setSelectedVideo={setSelectedVideo}
      />

      {selectedVideo && (
        <VideoDetails
          selectedVideo={selectedVideo}
          setSelectedVideo={setSelectedVideo}
          onFeedback={() => {
            setShowFeedback(true);
          }}
        />
      )}

      {showFeedback && selectedVideo && (
        <Feedback
          video={selectedVideo}
          onSubmit={handleFeedback}
          onClose={() => {
            setShowFeedback(false);
            setSelectedVideo(null);
          }}
        />
      )}
    </div>
  );
}

export default UploadVideo;