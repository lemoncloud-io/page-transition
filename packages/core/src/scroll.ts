/**
 * Scroll position stack for back navigation restoration.
 *
 * Forward navigation pushes the current scroll position.
 * Back navigation pops and restores the saved position.
 */

export interface ScrollPosition {
    x: number;
    y: number;
}

const MAX_STACK_SIZE = 50;
const scrollStack: ScrollPosition[] = [];

export const pushScrollPosition = (): void => {
    if (scrollStack.length >= MAX_STACK_SIZE) {
        scrollStack.shift();
    }
    scrollStack.push({ x: window.scrollX, y: window.scrollY });
};

export const popScrollPosition = (): ScrollPosition | undefined => {
    return scrollStack.pop();
};

export const clearScrollStack = (): void => {
    scrollStack.length = 0;
};
