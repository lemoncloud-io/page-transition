import { useCallback } from 'react';

import { useNavigateWithTransition } from './useNavigateWithTransition';

import type { PageTransitionConfig } from '../types';

/**
 * Convenience hook for back navigation with transition.
 *
 * @param config - Optional configuration for platform-specific animations
 * @returns Callback function to navigate back
 *
 * @example
 * ```tsx
 * const goBack = useGoBack();
 *
 * // In JSX
 * <button onClick={goBack}>Back</button>
 *
 * // With custom platform
 * const goBack = useGoBack({ platform: 'ios' });
 * ```
 */
export const useGoBack = (config?: PageTransitionConfig): (() => void) => {
    const navigate = useNavigateWithTransition(config);

    return useCallback(() => {
        navigate(-1);
    }, [navigate]);
};
