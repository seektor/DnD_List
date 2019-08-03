import { TCoords } from "../../common/structures/TCoords";
import { TDomRect } from "../../common/structures/TDomRect";

export interface TDragViewportParams {
    initialCoordinates: TCoords;
    initialScrollableScrollTop: number;
    initialScrollableTop: number;
    initialScrollableScrollLeft: number;
    initialScrollableLeft: number;
    initialGridLeft: number;
    initialGridTop: number;
    visibleScrollableClientRect: TDomRect;
    horizontalScrollTriggerWidth: number;
    verticalScrollTriggerHeight: number;
}