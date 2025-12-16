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

export const PostCardSkeleton = ({ count = 3, columns = 3 }) => {
    const gridClasses = {
        1: 'grid grid-cols-1 gap-8',
        2: 'grid grid-cols-1 md:grid-cols-2 gap-8',
        3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
        4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'
    };
    
    return (
        <div className={gridClasses[columns] || gridClasses[3]}>
            {[...Array(count)].map((_, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const ArticleSkeleton = () => (
    <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="h-64 bg-gray-200 rounded mb-8"></div>
        <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
    </div>
);

export const TipCardSkeleton = ({ count = 3 }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(count)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 animate-pulse">
                <div className="w-10 h-10 bg-blue-600 rounded-full mb-4"></div>
                <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </div>
        ))}
    </div>
);

export const CategoryButtonSkeleton = ({ count = 3 }) => (
    <>
        {[...Array(count)].map((_, i) => (
            <div key={i} className="px-4 py-2 rounded-full bg-gray-200 animate-pulse w-24 h-9"></div>
        ))}
    </>
);
