import { TTranslate } from "./structures/TTranslate";
import { easeInOutCubic } from "../easingFunctions";

export function smoothTranslate(translations: TTranslate[], duration: number, onEndCallback?: () => void): void {

    let longestDistance: number = 0;
    translations.forEach(translation => {
        const xDistance: number = Math.abs(translation.fromX - translation.toX);
        const yDistance: number = Math.abs(translation.fromY - translation.toY);
        const maxDistance: number = Math.max(xDistance, yDistance);
        longestDistance = Math.max(longestDistance, maxDistance);
    });
    const startTime: number = new Date().getTime();
    const easeFunction: (t: number) => number = easeInOutCubic;
    translate();

    function translate(): void {
        const now: number = new Date().getTime();
        const calculatedTimeProgress: number = ((now - startTime) / duration);
        const timeProgress: number = Math.min(1, calculatedTimeProgress);
        const positionProgress: number = easeFunction(timeProgress);

        translations.forEach(translation => {
            const newTranslateX: number = translation.fromX + positionProgress * (translation.toX - translation.fromX);
            const newTranslateY: number = translation.fromY + positionProgress * (translation.toY - translation.fromY);
            translation.element.style.transform = buildTranslationStyle(newTranslateX, newTranslateY);
        });

        if (timeProgress !== 1) {
            requestAnimationFrame(translate);
        } else {
            if (onEndCallback) {
                requestAnimationFrame(() => onEndCallback());
            }
        }
    }

    function buildTranslationStyle(x: number, y: number): string {
        return `translate(${x}px, ${y}px)`;
    }

}
