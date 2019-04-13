import { TGridItemPlacement } from "./TGridItemPlacement";

export interface TGridMapData {
    gridMap: Int8Array[];
    itemPlacements: WeakMap<HTMLElement, TGridItemPlacement>;
}