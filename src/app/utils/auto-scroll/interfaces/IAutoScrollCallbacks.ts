export interface IAutoScrollCallbacks {
    cancel(): void;
    setIncrement(horizontalIncrement: number, verticalIncrement: number): void;
}