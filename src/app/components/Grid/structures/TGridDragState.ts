import { TDragViewportParams } from "../../List/structures/TDragViewportParams";
import { TGridView } from "./TGridView";
import { IAutoScrollCallbacks } from "../../../utils/auto-scroll/interfaces/IAutoScrollCallbacks";

export interface TGridDragState {
    originalDragItemsList: HTMLElement[];
    originalDraggedElementIndex: number;
    dragViewportParams: TDragViewportParams;
    gridView: TGridView;
    draggedElement: HTMLElement;
    containerScrollCallbacks: IAutoScrollCallbacks;
    isTranslating: boolean;
}