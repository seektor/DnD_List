import { TInitialDragViewportParams } from "../../List/structures/TInitialDragViewportParams";
import { TGridView } from "./TGridView";
import { IAutoScrollCallbacks } from "../../../utils/auto-scroll/interfaces/IAutoScrollCallbacks";

export interface TGridDragState {
    originalDragItemsList: HTMLElement[];
    placeholderIndex: number;
    initialDragViewportParams: TInitialDragViewportParams;
    gridView: TGridView;
    draggedElement: HTMLElement;
    containerScrollCallbacks: IAutoScrollCallbacks;
    isTranslating: boolean;
}