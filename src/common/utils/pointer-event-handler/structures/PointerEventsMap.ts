import { PointerEventsMapCallbacks } from "./PointerEventsMapCallback";

export interface PointerEventsMap {
    [eventType: string]: PointerEventsMapCallbacks[];
} 