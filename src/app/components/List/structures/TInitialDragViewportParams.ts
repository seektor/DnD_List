import { TCoords } from "../../../structures/TCoords";

export interface TInitialDragViewportParams {
    initialCoordinates: TCoords;
    initialComponentScrollTop: number;
    initialComponentTop: number;
    initialComponentScrollLeft: number;
    initialComponentLeft: number;
    initialGridElementLeft: number;
    initialGridElementTop: number;
    horizontalScrollTriggerWidth: number;
    verticalScrollTriggerHeight: number;
}