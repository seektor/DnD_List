import { TDragStartData } from "../../List/structures/TDragStartData";
import { TGridView } from "./TGridView";

export interface TGridDragState {
    originalDragItemsList: HTMLElement[];
    placeholderIndex: number;
    dragStartData: TDragStartData;
    gridView: TGridView;
    draggedElement: HTMLElement;
    isTranslating: boolean;
}