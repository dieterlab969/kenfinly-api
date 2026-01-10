import React from 'react';
import Footer from './Footer';

function Layout2({ children }) {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#94edfd' }}>
            <main className="flex-grow">
                {children}
            </main>
            <Footer showCopyright={false} />
        </div>
    );
}

export default Layout2;
