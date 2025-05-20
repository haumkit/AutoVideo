import React from 'react';

const ACTIONS = [
    'brush_hair',
    'cartwheel',
    'catch',
    'chew',
    'clap',
    'climb'
];

function ActionSelector({ selectedAction, onSelectAction }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginTop: '10px'
        }}>
            {ACTIONS.map((action) => (
                <button
                    key={action}
                    onClick={() => onSelectAction(action)}
                    style={{
                        padding: '10px',
                        backgroundColor: selectedAction === action ? '#4CAF50' : '#f5f5f5',
                        color: selectedAction === action ? 'white' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textTransform: 'capitalize'
                    }}
                >
                    {action.replace('_', ' ')}
                </button>
            ))}
        </div>
    );
}

export default ActionSelector; 