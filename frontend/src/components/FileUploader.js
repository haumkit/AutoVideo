import React from 'react';

function FileUploader({
    selectedFiles,
    setSelectedFiles,
    selectedVideos,
    setSelectedVideos,
    videoUrls,
    setVideoUrls,
    handleSelectVideo,
    handleSelectAll
}) {
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

    return (
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
    );
}

export default FileUploader; 