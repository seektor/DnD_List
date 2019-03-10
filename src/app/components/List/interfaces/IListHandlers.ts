export interface IListHandlers {
    onExternalDragStart(externalElement: HTMLElement, contentElement: HTMLElement): void;
    toggleDropzone: (isEnabled: boolean) => void;
}