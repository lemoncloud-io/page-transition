import { useCallback } from 'react';

import { useNavigateWithTransition } from './useNavigateWithTransition';

import type { PageTransitionConfig } from '@lemoncloud/page-transition-core';

/**
 * Convenience hook for back navigation with transition.
 *
 * @param config - Optional configuration for platform-specific animations
 * @returns Callback function to navigate back (returns Promise)
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
 *
 * // Await transition completion
 * const handleBack = async () => {
 *   await goBack();
 *   console.log('Back transition complete!');
 * };
 * ```
 */
export const useGoBack = (config?: PageTransitionConfig): (() => Promise<void>) => {
    const navigate = useNavigateWithTransition(config);

    return useCallback(() => {
        return navigate(-1);
    }, [navigate]);
};
