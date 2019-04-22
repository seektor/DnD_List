import { TCoords } from "../../../structures/TCoords";
import { TClientRect } from "../../../structures/TClientRect";

export interface TDragViewportParams {
    initialCoordinates: TCoords;
    initialScrollableScrollTop: number;
    initialScrollableTop: number;
    initialScrollableScrollLeft: number;
    initialScrollableLeft: number;
    initialGridLeft: number;
    initialGridTop: number;
    visibleScrollableClientRect: TClientRect;
    horizontalScrollTriggerWidth: number;
    verticalScrollTriggerHeight: number;
}