import { useState } from 'react';
import type { PlatformType } from '@lemoncloud/react-page-transition';

interface ConfigBarProps {
    platform: PlatformType | 'auto';
    onPlatformChange: (platform: PlatformType | 'auto') => void;
}

export const ConfigBar = ({ platform, onPlatformChange }: ConfigBarProps) => {
    const [dark, setDark] = useState(false);

    const toggleDark = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    };

    return (
        <div className="config-bar">
            <span className="config-label">Platform:</span>
            <div className="config-buttons">
                <button
                    className={`config-btn ${platform === 'auto' ? 'active' : ''}`}
                    onClick={() => onPlatformChange('auto')}
                >
                    Auto
                </button>
                <button
                    className={`config-btn ${platform === 'ios' ? 'active' : ''}`}
                    onClick={() => onPlatformChange('ios')}
                >
                    iOS
                </button>
                <button
                    className={`config-btn ${platform === 'android' ? 'active' : ''}`}
                    onClick={() => onPlatformChange('android')}
                >
                    Android
                </button>
            </div>

            <div className="config-divider" />

            <button className="config-btn" onClick={toggleDark}>
                {dark ? 'Light' : 'Dark'}
            </button>
        </div>
    );
};
