export interface IGridHandlers {
    toggleDropzone: (isEnabled: boolean) => void;
    onExternalDragStart(externalElement: HTMLElement, contentElement: HTMLElement, onInsertCallback: (index: number) => void): void;
    onExternalDragEnd(): void;
}