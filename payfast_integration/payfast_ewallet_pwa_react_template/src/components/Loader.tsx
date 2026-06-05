import React, { useEffect, useState } from 'react';


const Loader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    isLoading && (
      <div className="loader-mask">
        <div className="loading-window">
          <div className="loader">
            <div className="loader-inner line-scale">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    )
  );
};
export default Loader;
