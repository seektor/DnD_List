import { IAutoScrollCallbacks } from "./interfaces/IAutoScrollCallbacks";

export function autoScroll(container: HTMLElement, horizontalIncrement: number, verticalIncrement: number, onIncrementCallback?: () => void): IAutoScrollCallbacks {

    let isCancelled: boolean = false;
    let currentHorizontalIncrement: number = horizontalIncrement;
    let currentVerticalIncrement: number = verticalIncrement;
    const throttleTime: number = 16;
    let timeReference: number = throttleTime;
    scroll(throttleTime * 2);
    return {
        cancel: () => isCancelled = true,
        setIncrement: setIncrement,
    };

    function setIncrement(horizontalIncrement: number, verticalIncrement: number): void {
        currentHorizontalIncrement = horizontalIncrement;
        currentVerticalIncrement = verticalIncrement;
        if ((horizontalIncrement !== 0 || verticalIncrement !== 0) && isCancelled) {
            isCancelled = false;
            requestAnimationFrame(scroll);
        }
    }

    function scroll(now: DOMHighResTimeStamp): void {
        let isScrolledHorizontally: boolean = currentHorizontalIncrement > 0 ? container.scrollLeft + container.clientWidth >= container.scrollWidth : container.scrollLeft === 0;
        let isScrolledVertically: boolean = currentVerticalIncrement > 0 ? container.scrollTop + container.clientHeight >= container.scrollHeight : container.scrollTop === 0;
        const canScroll: boolean = !isScrolledHorizontally || !isScrolledVertically;
        if (!canScroll || isCancelled) {
            isCancelled = true;
            return;
        }
        const canRun: boolean = now - timeReference >= throttleTime;
        if (canRun) {
            const incrementedScrollLeftValue: number = container.scrollLeft + currentHorizontalIncrement;
            container.scrollLeft = Math.min(incrementedScrollLeftValue, container.scrollWidth);
            const incrementedScrollTopValue: number = container.scrollTop + currentVerticalIncrement;
            container.scrollTop = Math.min(incrementedScrollTopValue, container.scrollHeight);
            timeReference = now;
            requestAnimationFrame(scroll);
            onIncrementCallback && requestAnimationFrame(() => onIncrementCallback());
        } else {
            requestAnimationFrame(scroll);
        }
    }



}