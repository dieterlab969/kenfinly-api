import React from 'react';
import Navbar2 from './Navbar2';
import Footer from './Footer';

function Layout2({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
            <header className="w-full">
                <Navbar2 />
            </header>
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {children}
            </main>
            <Footer showAnalytics={false} />
        </div>
    );
}

export default Layout2;
