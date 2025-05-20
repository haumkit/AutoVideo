import React, { useState } from 'react';
import ActionSelector from './ActionSelector';

function Feedback({ video, onSubmit, onClose }) {
    const [action, setAction] = useState('');
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Submit clicked');
        console.log('Current state:', { action, comment, video });

        if (!action) {
            setError('Please select an action');
            console.log('No action selected');
            return;
        }

        if (!video || !video._id) {
            setError('Invalid video data');
            console.log('Invalid video:', video);
            return;
        }

        try {
            const feedbackData = {
                video_id: video._id,
                filename: video.filename,
                correct_action: action,
                comment: comment
            };
            console.log('Submitting feedback:', feedbackData);
            onSubmit(feedbackData);
        } catch (err) {
            setError('Error preparing feedback: ' + err.message);
            console.error('Error in handleSubmit:', err);
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
                <p><strong>Video:</strong> {video.filename}</p>
                <p><strong>Current Action:</strong> {video.action}</p>

                {error && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '5px',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginTop: '20px' }}>
                        <h4>Select Correct Action:</h4>
                        <ActionSelector
                            selectedAction={action}
                            onSelectAction={setAction}
                        />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            Comment (optional):
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '5px',
                                border: '1px solid #ccc',
                                minHeight: '100px'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                            type="button"
                            onClick={onClose}
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
                            type="submit"
                            disabled={!action}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: action ? 'pointer' : 'not-allowed',
                                opacity: action ? 1 : 0.6
                            }}
                        >
                            Submit Feedback
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Feedback; 