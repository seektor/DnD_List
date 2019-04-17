import { TDragStartData } from "../../List/structures/TDragStartData";
import { TGridView } from "./TGridView";
import { IAutoScrollCallbacks } from "../../../utils/auto-scroll/interfaces/IAutoScrollCallbacks";

export interface TGridDragState {
    originalDragItemsList: HTMLElement[];
    placeholderIndex: number;
    dragStartData: TDragStartData;
    gridView: TGridView;
    draggedElement: HTMLElement;
    containerScrollCallbacks: IAutoScrollCallbacks;
    isTranslating: boolean;
}