import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

function PublicLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default PublicLayout;
