import { EventsMapCallbacks } from "./EventsMapCallback";

export interface EventsMap {
    [eventType: string]: EventsMapCallbacks[];
} 