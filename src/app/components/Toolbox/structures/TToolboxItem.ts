import { IGridHandlers } from "../../Grid/interfaces/IGridHandlers";

export interface TToolboxItem {
    dropzoneContent: HTMLElement;
    dropzoneCallbacks: IGridHandlers;
}