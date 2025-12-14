import React from 'react';

export const StatsSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center animate-pulse">
                <div className="h-12 bg-blue-400 rounded w-20 mx-auto mb-2"></div>
                <div className="h-4 bg-blue-300 rounded w-24 mx-auto"></div>
            </div>
        ))}
    </div>
);

export const ValuesSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-8 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-xl mx-auto mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-24 mx-auto mb-3"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        ))}
    </div>
);

export const ContentSkeleton = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
);
