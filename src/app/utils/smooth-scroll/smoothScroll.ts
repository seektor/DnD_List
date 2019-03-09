import { easeInCubic } from "./easingFunctions";

/* TODO: Unhandled situations: 
    1. The user is scrolling manually during the processing.
    2. Resizes?
*/
export function smoothScroll(container: HTMLElement, duration: number, distance: number): void {

    const startOffset: number = container.scrollTop;
    const destinationOffset: number = startOffset + distance;
    const startTime: number = new Date().getTime();
    const easeFunction: (t: number) => number = easeInCubic;
    scroll();

    function scroll(): void {
        const now: number = new Date().getTime();
        const calculatedTimeProgress: number = ((now - startTime) / duration);
        const timeProgress: number = Math.min(1, calculatedTimeProgress);
        const positionProgress: number = easeFunction(timeProgress);
        const newOffset: number = positionProgress * distance + startOffset;
        container.scrollTop = newOffset;

        if (container.scrollTop !== destinationOffset) {
            requestAnimationFrame(scroll);
        }
    }

}
