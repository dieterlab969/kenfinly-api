import React from 'react';
import { Link } from 'react-router-dom';

export const LOGO_WHITE = '/images/logo-white-text.png';
export const LOGO_BLACK = '/images/logo-black-text.png';

const DynamicLogo = ({
    className = "h-8 w-auto",
    showText = false,
    textClassName = "text-xl font-bold",
    brandingText = "KENFINLY",
    variant = "black"
}) => {
    const src = variant === "white" ? LOGO_WHITE : LOGO_BLACK;

    return (
        <Link to="/" className="flex items-center logo-container">
            <img
                src={src}
                alt="Kenfinly Logo"
                className={`${className} object-contain`}
            />
            {showText && <span className={textClassName}>{brandingText}</span>}
        </Link>
    );
};

export default DynamicLogo;
