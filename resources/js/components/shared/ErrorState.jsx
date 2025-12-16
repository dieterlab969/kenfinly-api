import React from 'react';
import { AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';

export function ErrorState({ 
    title = 'Content Temporarily Unavailable',
    message = 'We\'re having trouble loading this content. Please try again.',
    onRetry = null,
    retryLabel = 'Try Again',
    icon: Icon = AlertCircle,
    variant = 'default'
}) {
    const variants = {
        default: 'bg-gray-50 border-gray-200',
        card: 'bg-white border-gray-200',
        blue: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
    };

    return (
        <div className={`text-center py-12 rounded-xl border ${variants[variant]}`}>
            <Icon className="w-16 h-16 text-red-400 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    aria-label={retryLabel}
                    className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded px-2 py-1"
                >
                    {retryLabel}
                    <ArrowRight className="ml-1 w-4 h-4" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}

export function EmptyState({
    title = 'No Content Found',
    message = 'Check back soon for new content!',
    icon: Icon = TrendingUp,
    action = null
}) {
    return (
        <div className="text-center py-12">
            <Icon className="w-20 h-20 text-gray-300 mx-auto mb-6" aria-hidden="true" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-3">{title}</h3>
            <p className="text-gray-500 mb-6">{message}</p>
            {action}
        </div>
    );
}

export default ErrorState;
