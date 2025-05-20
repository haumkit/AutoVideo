import React, { useState, useEffect } from 'react';
import ActionSelector from './ActionSelector';

function ProcessingResults({ results, selectedFiles, onFeedback }) {
    const [showFeedback, setShowFeedback] = useState({});
    const [selectedActions, setSelectedActions] = useState({});
    const [feedbackComments, setFeedbackComments] = useState({});
    const [feedbackSubmitted, setFeedbackSubmitted] = useState({});

    // Clear old results when selectedFiles changes
    useEffect(() => {
        setShowFeedback({});
        setSelectedActions({});
        setFeedbackComments({});
        setFeedbackSubmitted({});
    }, [selectedFiles]);

    if (!results || results.length === 0) return null;

    const handleFeedback = (index) => {
        if (!selectedActions[index]) {
            return;
        }

        onFeedback({
            video_id: results[index].video_id,
            correct_action: selectedActions[index],
            comment: feedbackComments[index] || ''
        });

        // Set feedback submitted for this result
        setFeedbackSubmitted(prev => ({ ...prev, [index]: true }));

        // Reset feedback state for this result
        setShowFeedback(prev => ({ ...prev, [index]: false }));
        setSelectedActions(prev => ({ ...prev, [index]: '' }));
        setFeedbackComments(prev => ({ ...prev, [index]: '' }));
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>Processing Results:</h3>
            <div style={{
                display: 'grid',
                gap: '10px'
            }}>
                {results.map((result, index) => {
                    const file = selectedFiles.find(f => f.name === result.filename);
                    return (
                        <div
                            key={index}
                            style={{
                                padding: '15px',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '5px'
                            }}
                        >
                            <p><strong>File:</strong> {file?.name}</p>
                            {result.action && (
                                <p><strong>Detected Action:</strong> {result.action}</p>
                            )}
                            {result.error && (
                                <p style={{ color: 'red' }}><strong>Error:</strong> {result.error}</p>
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

                            {feedbackSubmitted[index] ? (
                                <div style={{
                                    marginTop: '15px',
                                    padding: '10px',
                                    backgroundColor: '#E8F5E9',
                                    borderRadius: '5px',
                                    color: '#2E7D32'
                                }}>
                                    Thank you for your feedback!
                                </div>
                            ) : !showFeedback[index] ? (
                                <button
                                    onClick={() => setShowFeedback(prev => ({ ...prev, [index]: true }))}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        marginTop: '10px'
                                    }}
                                >
                                    Provide Feedback
                                </button>
                            ) : (
                                <div style={{ marginTop: '15px' }}>
                                    <h4>Select Correct Action:</h4>
                                    <ActionSelector
                                        selectedAction={selectedActions[index]}
                                        onSelectAction={(action) => setSelectedActions(prev => ({ ...prev, [index]: action }))}
                                    />
                                    <div style={{ marginTop: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                            Comment (optional):
                                        </label>
                                        <textarea
                                            value={feedbackComments[index] || ''}
                                            onChange={(e) => setFeedbackComments(prev => ({ ...prev, [index]: e.target.value }))}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '5px',
                                                border: '1px solid #ccc',
                                                minHeight: '80px'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button
                                            onClick={() => {
                                                setShowFeedback(prev => ({ ...prev, [index]: false }));
                                                setSelectedActions(prev => ({ ...prev, [index]: '' }));
                                                setFeedbackComments(prev => ({ ...prev, [index]: '' }));
                                            }}
                                            style={{
                                                padding: '8px 16px',
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
                                            onClick={() => handleFeedback(index)}
                                            disabled={!selectedActions[index]}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: selectedActions[index] ? 'pointer' : 'not-allowed',
                                                opacity: selectedActions[index] ? 1 : 0.6
                                            }}
                                        >
                                            Submit Feedback
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ProcessingResults; 