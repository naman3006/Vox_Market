import React from 'react';
import Skeleton from './Skeleton';

const ProductCardSkeleton = () => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            {/* Image Area */}
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <Skeleton className="w-full h-full" />
                {/* Badge Placeholders */}
                <div className="absolute top-3 left-3">
                    <Skeleton width="40px" height="20px" variant="rect" className="rounded-full" />
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-grow space-y-3">
                {/* Brand/Category */}
                <div className="flex justify-between items-start">
                    <Skeleton width="30%" height="12px" />
                </div>

                {/* Title */}
                <Skeleton width="90%" height="20px" className="mb-2" />

                {/* Rating */}
                <div className="flex items-center space-x-2">
                    <Skeleton width="80px" height="16px" />
                </div>

                {/* Price Area */}
                <div className="mt-auto pt-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <Skeleton width="60px" height="24px" />
                        <Skeleton width="40px" height="12px" />
                    </div>
                    {/* Add Button */}
                    <Skeleton width="40px" height="40px" className="rounded-xl" />
                </div>
            </div>
        </div>
    );
};

export default ProductCardSkeleton;
