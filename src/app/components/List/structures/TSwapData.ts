import { DraggedItemLocation } from "./DraggedItemLocation";

export interface TSwapData {
    placeholderPosition: number;
    draggedOverPosition: number;
    draggedItemLocation: DraggedItemLocation;
    fromAffectedItemIndex: number;
    toAffectedItemIndex: number;
}