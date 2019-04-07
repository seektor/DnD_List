import { SyntheticEventCallback } from "./EventCallbacks";

export interface EventsMapCallbacks {
    refCallback: SyntheticEventCallback;
    mouseCallback: (e: MouseEvent) => void;
    touchCallback: (e: TouchEvent) => void;
}