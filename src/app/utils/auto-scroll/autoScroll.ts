import { Orientation } from "../../structures/Orientation";
import { IAutoScrollCallbacks } from "./structures/IAutoScrollCallbacks";

export function autoScroll(container: HTMLElement, orientation: Orientation, increment: number): IAutoScrollCallbacks {

    let isCancelled: boolean = false;
    let currentIncrement: number = increment;
    const throttleTime: number = 200;
    let timeReference: number = throttleTime;
    scrollHorizontally(throttleTime * 2);
    return {
        cancel: () => isCancelled = true,
        setIncrement: (value) => currentIncrement = value,
    };

    function scrollHorizontally(now: DOMHighResTimeStamp): void {
        const isScrolled: boolean = container.scrollLeft + container.clientWidth >= container.scrollWidth;
        if (isScrolled || isCancelled) {
            console.log("I AM DONE");
            return;
        }
        const canRun: boolean = now - timeReference >= throttleTime;
        if (canRun) {
            const incrementedScrollLeftValue: number = container.scrollLeft + currentIncrement;
            console.log(Math.min(incrementedScrollLeftValue, container.scrollWidth));
            container.scrollLeft = Math.min(incrementedScrollLeftValue, container.scrollWidth);
            timeReference = now;
            requestAnimationFrame(scrollHorizontally);
        } else {
            requestAnimationFrame(scrollHorizontally);
        }
    }

}