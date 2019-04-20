export interface TWindowResizeSubscriber {
    element: HTMLElement;
    callback: () => void;
}