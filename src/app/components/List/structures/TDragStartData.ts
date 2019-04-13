import { TCoords } from "../../../structures/TCoords";

export interface TDragStartData {
    initialCoordinates: TCoords;
    initialComponentScrollTop: number;
    initialComponentTop: number;
    initialComponentScrollLeft: number;
    initialComponentLeft: number;
}