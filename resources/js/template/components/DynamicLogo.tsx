import React from 'react';
import { useDarkMode } from './DarkModeContext';

interface DynamicLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

const DynamicLogo: React.FC<DynamicLogoProps> = ({ className, style }) => {
  const { isDarkMode } = useDarkMode();

  return (
    <img
      src={isDarkMode ? '/logos/logo-white.png' : '/logos/logo-black.png'}
      alt="logo"
      className={className}
      style={style}
    />
  );
};

export default DynamicLogo;
