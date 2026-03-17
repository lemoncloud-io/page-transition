import { createContext, useContext, useState, type ReactNode } from 'react';
import type { PlatformType } from '@lemoncloud/react-page-transition';

interface PlatformContextValue {
    platform: PlatformType | 'auto';
    setPlatform: (platform: PlatformType | 'auto') => void;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export const PlatformProvider = ({ children }: { children: ReactNode }) => {
    const [platform, setPlatform] = useState<PlatformType | 'auto'>('auto');

    return (
        <PlatformContext.Provider value={{ platform, setPlatform }}>
            {children}
        </PlatformContext.Provider>
    );
};

export const usePlatformContext = (): PlatformContextValue => {
    const context = useContext(PlatformContext);
    if (!context) {
        throw new Error('usePlatformContext must be used within PlatformProvider');
    }
    return context;
};
