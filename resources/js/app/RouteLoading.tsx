import React from 'react';

const RouteLoading: React.FC = () => (
    <div
        role="status"
        aria-live="polite"
        aria-label="Loading page"
        style={{
            minHeight: '40vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
        }}
    >
        <div
            aria-hidden="true"
            style={{
                width: 36,
                height: 36,
                border: '4px solid rgba(123, 81, 241, 0.18)',
                borderTopColor: '#7B51F1',
                borderRadius: '50%',
                animation: 'route-loading-spin 0.8s linear infinite',
            }}
        />
        <style>{`
            @keyframes route-loading-spin {
                to { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

export default RouteLoading;