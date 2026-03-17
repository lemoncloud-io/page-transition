import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Import transition CSS - required for animations
import '@lemoncloud/react-page-transition/styles.css';

import { App } from './App';
import { PlatformProvider } from './context';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <PlatformProvider>
                <App />
            </PlatformProvider>
        </BrowserRouter>
    </React.StrictMode>
);
