import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import JsonLd from '../shared/JsonLd';

function PublicLayout({ children, schemaData }) {
    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#94edfd' }}>
            <JsonLd data={schemaData} />
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default PublicLayout;
