import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { useLogo } from '../contexts/LogoContext';

const DynamicLogo = ({ className = "w-10 h-10", iconClassName = "w-6 h-6", showText = false, textClassName = "text-xl font-bold", brandingText = "KENFINLY" }) => {
    const { logoUrl } = useLogo();

    return (
        <Link to="/" className="flex items-center space-x-2 logo-container">
            {logoUrl ? (
                <>
                    <img src={logoUrl} alt="Kenfinly Logo" className={`${className} object-contain`} />
                    {showText && <span className={textClassName}>{brandingText}</span>}
                </>
            ) : (
                <>
                    <div className={`${className} bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center`}>
                        <Wallet className={`${iconClassName} text-white`} />
                    </div>
                    {showText ? (
                        <h1 className={`${textClassName}`}>
                            {brandingText}
                        </h1>
                    ) : (
                        <h1 className={`${textClassName} bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}>
                            Kenfinly
                        </h1>
                    )}
                </>
            )}
        </Link>
    );
};

export default DynamicLogo;
