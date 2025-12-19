import React, { useState } from 'react';
import Skeleton from './Skeleton/Skeleton';

const OptimizedImage = ({ src, alt, className, width, height, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    return (
        <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
            {/* Loading Placeholder */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 z-10">
                    <Skeleton className="w-full h-full rounded-none" />
                </div>
            )}

            {/* Error Fallback */}
            {hasError && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 text-gray-400">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            {/* Actual Image */}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                {...props}
            />
        </div>
    );
};

export default OptimizedImage;
