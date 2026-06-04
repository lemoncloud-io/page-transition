import { useCallback } from 'react';

import { useNavigateWithTransition } from './useNavigateWithTransition';

import type { PageTransitionConfig } from '@lemoncloud/page-transition-core';
import type { TransitionNavigateOptions } from './types';

export type GoBackOptions = Pick<
    TransitionNavigateOptions,
    'animation' | 'customization' | 'signal' | 'onSkipped' | 'legacyFlushSync' | 'scrollRoot'
>;

/**
 * Convenience hook for back navigation with transition. Optional
 * options forward to the underlying `useNavigateWithTransition`
 * — useful for canceling in-flight back gestures, observing skip
 * reasons, or overriding the animation type.
 *
 * @example
 * ```tsx
 * const goBack = useGoBack();
 * <button onClick={() => goBack()}>Back</button>
 *
 * // Cancel an in-flight back navigation
 * const controller = new AbortController();
 * goBack({ signal: controller.signal });
 *
 * // Debug why an animation was skipped
 * goBack({ onSkipped: (reason) => console.warn(reason) });
 * ```
 */
export const useGoBack = (config?: PageTransitionConfig): ((options?: GoBackOptions) => Promise<void>) => {
    const navigate = useNavigateWithTransition(config);

    return useCallback(
        (options?: GoBackOptions) => {
            return navigate(-1, options);
        },
        [navigate]
    );
};
