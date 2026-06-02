import React, { useState, useEffect } from 'react';

const ProfileAvatar = ({ src, username, className = "w-12 h-12", onClick }) => {
    const [isError, setIsError] = useState(false);
    const fallback = `https://ui-avatars.com/api/?name=${username || 'User'}&background=random&color=fff&size=128`;
    
    // Reset error state when src changes
    useEffect(() => {
        setIsError(false);
    }, [src]);

    const handleImageError = () => {
        console.warn(`Failed to load image for ${username}: ${src}`);
        setIsError(true);
    };

    return (
        <div 
            className={`${className} rounded-full overflow-hidden border-2 border-white shadow-sm cursor-pointer bg-white flex items-center justify-center`}
            onClick={onClick}
        >
            <img 
                key={src} // Force re-render when src changes
                src={(isError || !src) ? fallback : src} 
                onError={handleImageError}
                className="w-full h-full object-cover" 
                alt={username || "Profile"} 
            />
        </div>
    );
};

export default ProfileAvatar;
