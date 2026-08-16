import React, { type ErrorInfo, type ReactNode } from 'react';

interface RouteErrorBoundaryProps {
    children: ReactNode;
}

interface RouteErrorBoundaryState {
    error: Error | null;
}

class RouteErrorBoundary extends React.Component<
    RouteErrorBoundaryProps,
    RouteErrorBoundaryState
> {
    state: RouteErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Lazy route failed to load', error, errorInfo);
    }

    handleRetry = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (!this.state.error) {
            return this.props.children;
        }

        return (
            <main
                role="alert"
                style={{
                    minHeight: '60vh',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                }}
            >
                <div>
                    <h1>We couldn’t load this page</h1>
                    <p>Please try again. Your data has not been changed.</p>
                    <button type="button" onClick={this.handleRetry}>
                        Try again
                    </button>
                </div>
            </main>
        );
    }
}

export default RouteErrorBoundary;