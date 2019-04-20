import { TWindowResizeSubscriber } from "./TWindowResizeSubscriber";

export interface TResizeSubscriber extends TWindowResizeSubscriber {
    prevClientWidth: number;
    prevClientHeight: number;
}