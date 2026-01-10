import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

function PublicLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#94edfd' }}>
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default PublicLayout;
