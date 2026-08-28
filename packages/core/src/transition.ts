import {
    ANDROID_PLATFORM_CLASS,
    ANIMATION_CLASSES,
    ANIMATION_FADE_CLASS,
    ANIMATION_LIFT_CLASS,
    ANIMATION_SLIDE_CLASS,
    ANIMATION_ZOOM_CLASS,
    BACK_NAVIGATION_CLASS,
} from './constants';
import { resolvePlatform } from './platform';
import { isReducedMotion } from './reduced-motion';
import { applyScrollPosition, discardScrollPosition, peekScrollPosition, saveScrollPosition } from './scroll';
import { claimTransition, getCurrentEntry, releaseTransition } from './transition-state';

import type {
    AnimationType,
    SkipReason,
    TransitionCustomization,
    TransitionOptions,
    ViewTransition,
} from './types';

const ANIMATION_CLASS_MAP: Record<Exclude<AnimationType, 'none'>, string> = {
    fade: ANIMATION_FADE_CLASS,
    zoom: ANIMATION_ZOOM_CLASS,
    lift: ANIMATION_LIFT_CLASS,
    slide: ANIMATION_SLIDE_CLASS,
};

export const resolveTransitionClasses = (options?: TransitionOptions): string[] => {
    const classesToAdd: string[] = [];

    if (options?.animation && options.animation !== 'none') {
        classesToAdd.push(ANIMATION_CLASS_MAP[options.animation]);
    } else if (!options?.animation) {
        const platform = resolvePlatform(options?.config);
        if (platform === 'android') {
            classesToAdd.push(ANDROID_PLATFORM_CLASS);
        }
    }

    if (options?.direction === 'back') {
        classesToAdd.push(BACK_NAVIGATION_CLASS);
    }

    return classesToAdd;
};

export const cleanupTransitionClasses = (): void => {
    if (typeof document === 'undefined') return;
    ANIMATION_CLASSES.forEach(cls => document.documentElement.classList.remove(cls));
};

const DURATION_OVERRIDE_PROPERTY = '--pt-duration-override';
const EASING_OVERRIDE_PROPERTY = '--pt-easing-override';

const applyCustomization = (customization?: TransitionCustomization): void => {
    if (!customization) return;
    const root = document.documentElement;
    if (customization.duration !== undefined) {
        root.style.setProperty(DURATION_OVERRIDE_PROPERTY, `${customization.duration}ms`);
    }
    if (customization.easing !== undefined) {
        root.style.setProperty(EASING_OVERRIDE_PROPERTY, customization.easing);
    }
};

const cleanupCustomization = (): void => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.removeProperty(DURATION_OVERRIDE_PROPERTY);
    root.style.removeProperty(EASING_OVERRIDE_PROPERTY);
};

type StartViewTransition = (callback: () => void | Promise<void>) => ViewTransition;

const getStartViewTransition = (): StartViewTransition | undefined => {
    if (typeof document === 'undefined') return undefined;
    const fn = document.startViewTransition;
    return typeof fn === 'function' ? fn.bind(document) : undefined;
};

/**
 * Checks if the View Transitions API is supported in the current browser.
 */
export const isViewTransitionSupported = (): boolean => {
    return getStartViewTransition() !== undefined;
};

const runNavigation = async (navigationFn: () => void | Promise<void>): Promise<void> => {
    const result = navigationFn();
    if (result instanceof Promise) await result;
};

/**
 * Invokes a consumer callback that may be sync, async, or throw either
 * synchronously or via a rejected Promise. All paths are swallowed —
 * an unhandled `onSkipped` rejection must not crash the navigation.
 */
const safeInvoke = (fn: ((reason: SkipReason) => void | Promise<unknown>) | undefined, reason: SkipReason): void => {
    if (!fn) return;
    try {
        const result = fn(reason);
        if (result && typeof (result as Promise<unknown>).catch === 'function') {
            (result as Promise<unknown>).catch(() => {
                /* swallow async rejection from consumer callback */
            });
        }
    } catch {
        /* swallow sync throw from consumer callback */
    }
};

const notifySkipped = (options: TransitionOptions | undefined, reason: SkipReason): void => {
    safeInvoke(options?.onSkipped, reason);
};

const resolveScrollRoot = (options?: TransitionOptions): Element | null => {
    const root = options?.scrollRoot;
    if (!root) return null;
    return typeof root === 'function' ? root() : root;
};

const handleBackScroll = (root: Element | null, delta: number): void => {
    const saved = peekScrollPosition(delta);
    if (saved) {
        applyScrollPosition(saved, root);
    }
};

const setupAnimationState = (options: TransitionOptions | undefined): void => {
    const classesToAdd = resolveTransitionClasses(options);
    classesToAdd.forEach(cls => document.documentElement.classList.add(cls));
    applyCustomization(options?.customization);
};

const teardownAnimationState = (): void => {
    cleanupTransitionClasses();
    cleanupCustomization();
};

const shortCircuit = async (
    navigationFn: () => void | Promise<void>,
    options: TransitionOptions | undefined,
    reason: SkipReason
): Promise<void> => {
    notifySkipped(options, reason);
    await runNavigation(navigationFn);
};

/**
 * Executes a page transition using the View Transitions API.
 *
 * Behavior:
 * 1. Skips the animation (calling `onSkipped`) when unsupported, when
 *    the user prefers reduced motion, when `animation: 'none'`, or
 *    when the caller aborts.
 * 2. If a transition is already in flight, the previous one is
 *    `skipTransition()`-ed before the new one starts. The previous
 *    caller is notified via its `onSkipped('superseded')`.
 * 3. `navigationFn` is awaited inside the View Transitions callback,
 *    so async routers (Promise-returning navigate) snapshot the
 *    correct DOM.
 */
export const executePageTransition = async (
    navigationFn: () => void | Promise<void>,
    options?: TransitionOptions
): Promise<void> => {
    if (options?.signal?.aborted) {
        notifySkipped(options, 'aborted');
        return;
    }

    if (options?.animation === 'none') {
        return shortCircuit(navigationFn, options, 'animation-none');
    }

    const startViewTransition = getStartViewTransition();
    if (!startViewTransition) {
        return shortCircuit(navigationFn, options, 'unsupported');
    }

    if (isReducedMotion()) {
        return shortCircuit(navigationFn, options, 'reduced-motion');
    }

    supersedePreviousTransition();

    const isBack = options?.direction === 'back';
    const delta = options?.delta ?? (isBack ? -1 : 0);
    const scrollRoot = resolveScrollRoot(options);
    // Held so a failed navigation can roll back by the key it actually
    // wrote: the router may already have committed (react-router's push
    // calls `pushState` synchronously) before the failure, in which case
    // the current entry is no longer the one this transition saved.
    // `undefined` on a back navigation, where nothing was saved.
    const savedScrollKey = isBack ? undefined : saveScrollPosition(scrollRoot);

    setupAnimationState(options);

    let viewTransition: ViewTransition;
    try {
        viewTransition = startViewTransition(async () => {
            try {
                await runNavigation(navigationFn);
            } catch (err) {
                // Callback threw — drop the entry we saved before
                // `startViewTransition` so the scroll store stays
                // balanced. Re-throw so `viewTransition.finished`
                // rejects and the outer finally cleans up the rest.
                discardScrollPosition(savedScrollKey);
                throw err;
            }
            if (isBack) {
                handleBackScroll(scrollRoot, delta);
            } else {
                applyScrollPosition({ x: 0, y: 0 }, scrollRoot);
            }
        });
    } catch {
        discardScrollPosition(savedScrollKey);
        teardownAnimationState();
        return;
    }

    claimTransition({ vt: viewTransition, onSkipped: options?.onSkipped });

    const onAbort = (): void => {
        try {
            viewTransition.skipTransition();
        } catch {
            // Ignore — transition may already be done.
        }
        notifySkipped(options, 'aborted');
    };
    options?.signal?.addEventListener('abort', onAbort, { once: true });

    try {
        await viewTransition.finished;
    } catch {
        // Swallow — finished can reject if the transition was skipped
        // or if the callback threw. Scroll pop is handled inside the
        // callback's own catch above.
    } finally {
        options?.signal?.removeEventListener('abort', onAbort);
        teardownAnimationState();
        releaseTransition(viewTransition);
    }
};

const supersedePreviousTransition = (): void => {
    const previous = getCurrentEntry();
    if (!previous) return;
    try {
        previous.vt.skipTransition();
    } catch {
        // Browsers may throw if the previous transition already settled.
    }
    safeInvoke(previous.onSkipped, 'superseded');
};
