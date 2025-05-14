import React, { useState } from 'react';

function UploadVideo() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a video file first!");
      setResult('');
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    // Sử dụng localhost:9000 khi chạy từ trình duyệt, autovideo:9000 khi chạy trong Docker
    const autovideoUrl = window.location.hostname === 'localhost' ? 'http://localhost:9000' : 'http://autovideo:9000';
    try {
      const response = await fetch(`${autovideoUrl}/recogonize`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.message === "Video processed successfully") {
        setResult(`Detected Action: ${data.action}`);
        setError('');
      } else {
        setError(`${data.message}: ${data.error || "Unknown error"}`);
        setResult('');
      }
    } catch (err) {
      setError("Failed to upload video: " + err.message);
      setResult('');
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Video Action Recognition</h1>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <br /><br />
      <button onClick={handleUpload}>Upload and Recognize</button>
      {result && <p style={{ color: 'green', marginTop: '20px' }}>{result}</p>}
      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
    </div>
  );
}

export default UploadVideo;

/* import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UploadVideo() {
  const [file, setFile] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [action, setAction] = useState(null);
  const [history, setHistory] = useState([]);

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);
    setStatus('processing');
    try {
      const response = await axios.post('http://localhost:9000/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVideoId(response.data.video_id);
      setAction(response.data.action);
      setStatus('completed');
    } catch (error) {
      setStatus('error');
      console.error(error);
    }
  };

  useEffect(() => {
    if (videoId) {
      const interval = setInterval(async () => {
        const processing = await axios.get(`http://localhost:9000/check-status/${videoId}`);
        if (processing.data.status === 'completed' || processing.data.status === 'error') {
          clearInterval(interval);
        }
        setStatus(processing.data.status);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [videoId]);

  const fetchHistory = async () => {
    const response = await axios.get('http://localhost:9000/history');
    setHistory(response.data);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Video Action Recognition</h1>
      <input type="file" accept="video/*" onChange={handleFileUpload} />
      {file && (
        <div>
          <h3>Video đang xử lý: {file.name}</h3>
          <video width="320" height="240" controls>
            <source src={URL.createObjectURL(file)} type={file.type} />
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        </div>
      )}
      {status === 'processing' && <p>Đang xử lý video...</p>}
      {status === 'completed' && action && <p>Hành động phát hiện: {action}</p>}
      {status === 'error' && <p>Lỗi khi xử lý video</p>}
      <button onClick={fetchHistory}>Xem lịch sử</button>
      {history.length > 0 && (
        <div>
          <h3>Lịch sử dự đoán</h3>
          <ul>
            {history.map((item) => (
              <li key={item._id}>
                {item.filename} - Hành động: {item.action} - Thời gian: {new Date(item.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default UploadVideo; */