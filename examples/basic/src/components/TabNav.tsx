import { useLocation } from 'react-router-dom';
import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

import { usePlatformContext } from '../context';

const TABS = [
    { path: '/', label: 'Platform' },
    { path: '/animation', label: 'Animation' },
    { path: '/options', label: 'Options' },
];

export const TabNav = () => {
    const location = useLocation();
    const { platform } = usePlatformContext();
    const navigate = useNavigateWithTransition({ platform });

    const handleTabClick = (path: string) => {
        // No transition for tab switches
        navigate(path, { transition: false });
    };

    return (
        <nav className="tab-nav">
            {TABS.map((tab) => (
                <button
                    key={tab.path}
                    className={`tab-btn ${location.pathname === tab.path ? 'active' : ''}`}
                    onClick={() => handleTabClick(tab.path)}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
};
