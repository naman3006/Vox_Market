import React from 'react';

const Skeleton = ({ className, variant = 'rect', width, height }) => {
    const baseClasses = "bg-gray-200 animate-pulse rounded";

    // Variant specific styles
    const variants = {
        rect: "text-transparent",
        circle: "rounded-full",
        text: "h-4 rounded w-3/4"
    };

    const style = {
        width: width,
        height: height
    };

    return (
        <div
            className={`${baseClasses} ${variants[variant]} ${className || ''}`}
            style={style}
        />
    );
};

export default Skeleton;
