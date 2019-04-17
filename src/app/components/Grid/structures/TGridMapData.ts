import { TGridItemPlacement } from "./TGridItemPlacement";

export interface TGridMapData {
    gridMap: Int16Array[];
    itemPlacements: WeakMap<HTMLElement, TGridItemPlacement>;
}