import { IUnsubscribeCallback } from '../../interfaces/IUnsubscribeCallback';
import { easeInOutCubic } from '../easingFunctions';
import { TTranslate } from './structures/TTranslate';

export function smoothTranslate(translations: TTranslate[], duration: number, onEndCallback?: () => void): IUnsubscribeCallback {

    let isCancelled: boolean = false;
    let longestDistance: number = 0;
    let translateRequestReference: number;
    translations.forEach(translation => {
        const xDistance: number = Math.abs(translation.fromX - translation.toX);
        const yDistance: number = Math.abs(translation.fromY - translation.toY);
        const maxDistance: number = Math.max(xDistance, yDistance);
        longestDistance = Math.max(longestDistance, maxDistance);
    });
    const startTime: number = new Date().getTime();
    const easeFunction: (t: number) => number = easeInOutCubic;
    translate();
    return () => isCancelled = true;

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
        if (isCancelled) {
            cancelAnimationFrame(translateRequestReference);
            return;
        }
        if (timeProgress !== 1) {
            translateRequestReference = requestAnimationFrame(translate);
        } else {
            if (onEndCallback && !isCancelled) {
                requestAnimationFrame(() => onEndCallback());
            }
        }
    }

    function buildTranslationStyle(x: number, y: number): string {
        return `translate(${x}px, ${y}px)`;
    }

}
