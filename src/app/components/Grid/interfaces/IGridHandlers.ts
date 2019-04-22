export interface IGridHandlers {
    toggleDropzone: (isEnabled: boolean) => void;
    onExternalDragStart(externalDraggedElement: HTMLElement, itemContentElement: HTMLElement): void;
}