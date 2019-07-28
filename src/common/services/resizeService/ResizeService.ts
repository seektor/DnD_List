import { TResizeSubscriber } from './structures/TResizeSubscriber';
import { TWindowResizeSubscriber } from './structures/TWindowResizeSubscriber';

class ResizeService {

    private static instance: ResizeService;
    private anySubscribers: TResizeSubscriber[];
    private windowSubscribers: TWindowResizeSubscriber[];
    private interval: NodeJS.Timeout | null = null;

    private constructor() {
        this.anySubscribers = [];
        this.windowSubscribers = [];
    }

    public static getInstance(): ResizeService {
        return this.instance || (this.instance = new this());
    }

    public subscribeToAny(element: HTMLElement, callback: () => void): void {
        const subscriber: TResizeSubscriber = {
            callback,
            element,
            prevClientHeight: element.clientHeight,
            prevClientWidth: element.clientWidth
        }
        this.anySubscribers.push(subscriber);
        if (!this.interval) {
            this.interval = setInterval(() => this.checkDimensions(), 500);
        }
    }

    public subscribeToWindow(element: HTMLElement, callback: () => void): void {
        window.addEventListener('resize', callback);
        const subscriber: TWindowResizeSubscriber = { callback, element };
        this.windowSubscribers.push(subscriber);
    }

    private checkDimensions(): void {
        this.anySubscribers.forEach(subscriber => this.checkDimension(subscriber));
    }

    private checkDimension(subscriber: TResizeSubscriber): void {
        if (subscriber.element.clientWidth !== subscriber.prevClientWidth || subscriber.element.clientHeight !== subscriber.prevClientHeight) {
            subscriber.callback();
        }
        subscriber.prevClientWidth = subscriber.element.clientWidth;
        subscriber.prevClientHeight = subscriber.element.clientHeight;
    }

    public unsubscribe(element: HTMLElement): void {
        const anySubscriberIndex: number = this.anySubscribers.findIndex((subscriber) => subscriber.element === element);
        if (anySubscriberIndex !== -1) {
            this.anySubscribers.splice(anySubscriberIndex, 1);
            if (this.anySubscribers.length === 0) {
                clearTimeout(this.interval);
                this.interval = null;
            }
        } else {
            const windowSubscriberIndex: number = this.windowSubscribers.findIndex((subscriber) => subscriber.element === element);
            if (windowSubscriberIndex !== -1) {
                window.removeEventListener('resize', this.windowSubscribers[windowSubscriberIndex].callback);
                this.windowSubscribers.splice(windowSubscriberIndex, 1);
            }
        }
    }
}

export default ResizeService.getInstance();