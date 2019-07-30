export interface SyntheticEvent {
    currentTarget: EventTarget;
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    stopPropagation(): void;
    target: EventTarget;
}