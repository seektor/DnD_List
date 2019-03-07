export interface IListHandlers {
    setExternalDraggedElement(element: HTMLElement, title: string): void;
    toggleDropzone: (isEnabled: boolean) => void;
    toggleExternalElementAccessListener: (isEnabled: boolean) => void;
    externalDragStop();
}