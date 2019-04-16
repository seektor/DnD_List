import { TDragStartData } from "../../List/structures/TDragStartData";
import { TGridView } from "./TGridView";
import { IAutoScrollCallbacks } from "../../../utils/auto-scroll/structures/IAutoScrollCallbacks";

export interface TGridDragState {
    originalDragItemsList: HTMLElement[];
    placeholderIndex: number;
    dragStartData: TDragStartData;
    gridView: TGridView;
    draggedElement: HTMLElement;
    horizontalScrollCbs: IAutoScrollCallbacks | null;
    verticalScrollCbs: IAutoScrollCallbacks | null;
    isTranslating: boolean;
}