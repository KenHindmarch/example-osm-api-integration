'use client';

import React from 'react';
import ClientSessionProvider from './ClientSessionProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {

    return (
        <ClientSessionProvider>
            {children}
        </ClientSessionProvider>
    );
};

export default AppProviders;
