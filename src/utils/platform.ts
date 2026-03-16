import type { PlatformType } from '../types';

/**
 * Detects the current platform based on navigator.userAgent.
 *
 * @returns 'ios' | 'android' | undefined
 *
 * @example
 * ```ts
 * const platform = detectPlatform();
 * if (platform === 'android') {
 *   // Apply Android-specific logic
 * }
 * ```
 */
export const detectPlatform = (): PlatformType | undefined => {
    if (typeof navigator === 'undefined') return undefined;

    const userAgent = navigator.userAgent.toLowerCase();

    // Check for iOS devices
    const isIOS = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) return 'ios';

    // Check for Android devices
    const isAndroid = /android/.test(userAgent);

    if (isAndroid) return 'android';

    return undefined;
};

/**
 * Resolves the platform based on configuration.
 *
 * @param config - Platform configuration options
 * @returns Resolved platform or undefined for desktop
 */
export const resolvePlatform = (config?: {
    platform?: PlatformType | 'auto';
    detectPlatform?: () => PlatformType | undefined;
}): PlatformType | undefined => {
    // Custom detector takes priority
    if (config?.detectPlatform) {
        return config.detectPlatform();
    }

    // Explicit platform
    if (config?.platform && config.platform !== 'auto') {
        return config.platform;
    }

    // Auto-detect
    return detectPlatform();
};
