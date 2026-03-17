/**
 * View Transitions API type declarations
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 */

/** Represents a view transition */
export interface ViewTransition {
    /** Promise that resolves when the transition animation finishes */
    finished: Promise<void>;
    /** Promise that resolves when the pseudo-elements are created and the animation is about to start */
    ready: Promise<void>;
    /** Promise that resolves when the callback passed to startViewTransition() returns */
    updateCallbackDone: Promise<void>;
    /** Skips the animation part of the view transition */
    skipTransition: () => void;
}

/** Callback function for startViewTransition */
export type ViewTransitionCallback = () => void | Promise<void>;

declare global {
    interface Document {
        /**
         * Starts a new view transition
         * @param callback - A callback function that updates the DOM
         * @returns A ViewTransition object
         */
        startViewTransition?: (callback: ViewTransitionCallback) => ViewTransition;
    }
}

export {};
