import React from 'react';
import AppLayout from '../../components/AppLayout';
import { QuickAddProvider } from '../../context/QuickAddContext';

const AuthenticatedShell: React.FC = () => (
    <QuickAddProvider>
        <AppLayout />
    </QuickAddProvider>
);

export default AuthenticatedShell;