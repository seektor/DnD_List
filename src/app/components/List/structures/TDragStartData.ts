import { TCoordinates } from "../../../structures/TCoordinates";

export interface TDragStartData {
    initialCoordinates: TCoordinates;
    initialComponentScrollTop: number;
    initialComponentTop: number;
}