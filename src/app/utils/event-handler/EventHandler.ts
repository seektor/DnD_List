import { SyntheticEvent } from "./structures/SyntheticEvent";
import { EventsMap } from "./structures/EventsMap";
import { EventType } from "./structures/EventType";
import { SyntheticEventCallback, MouseEventCallback, TouchEventCallback } from "./structures/EventCallbacks";
import { EventsMapCallbacks } from "./structures/EventsMapCallback";

export class EventHandler {

    private syntheticEvent: SyntheticEvent;
    private subscribersMap: WeakMap<HTMLElement, Partial<EventsMap>>;

    constructor() {
        this.syntheticEvent = this.createEvent();
        this.subscribersMap = new WeakMap();
    }

    private createEvent(): SyntheticEvent {
        return {
            clientX: null,
            clientY: null,
            currentTarget: null,
            stopPropagation: null,
            target: null,
        }
    }

    public addEventListener(element: HTMLElement, type: EventType, callback: SyntheticEventCallback): void {
        if (!this.subscribersMap.has(element)) {
            this.subscribersMap.set(element, {});
        }
        const eventsMap: EventsMap = this.subscribersMap.get(element);
        if (!eventsMap[type]) {
            eventsMap.type = [];
        }
        const callbacksObjects: EventsMapCallbacks[] = eventsMap[type];
        const mouseEventName: string = this.getMouseEventName(type);
        const touchEventName: string = this.getTouchEventName(type);
        const mouseCallback: MouseEventCallback = (e: MouseEvent) => callback(this.mouseToSynthetic(e));
        const touchCallback: TouchEventCallback = (e: TouchEvent) => callback(this.touchToSynthetic(e));
        element.addEventListener(mouseEventName, mouseCallback);
        element.addEventListener(touchEventName, touchCallback);
        callbacksObjects.push({
            mouseCallback: mouseCallback,
            refCallback: callback,
            touchCallback: touchCallback
        });
    }

    public removeEventListener(element: HTMLElement, type: EventType, callback: SyntheticEventCallback): void {
        if (!this.subscribersMap.has(element)) {
            return;
        }
        const eventsMap: EventsMap = this.subscribersMap.get(element);
        if (!eventsMap[type]) {
            return;
        }
        const callbacksObjects: EventsMapCallbacks[] = eventsMap[type];
        const matchingCallbacksObjects: EventsMapCallbacks[] = callbacksObjects.filter(callbacksObject => callbacksObject.refCallback === callback);
        const mouseEventName: string = this.getMouseEventName(type);
        const touchEventName: string = this.getTouchEventName(type);
        matchingCallbacksObjects.forEach((callbackObject) => {
            element.removeEventListener(mouseEventName, callbackObject.mouseCallback);
            element.removeEventListener(touchEventName, callbackObject.touchCallback);
            callbacksObjects.splice(callbacksObjects.indexOf(callbackObject, 1));
        });
        if (callbacksObjects.length === 0) {
            this.subscribersMap.delete(element);
        }
    }

    private getMouseEventName(type: EventType): string {
        switch (type) {
            case EventType.ActionEnd:
                return "mouseend";
            case EventType.ActionMove:
                return "mousemove";
            case EventType.ActionStart:
                return "mousestart"
        }
    }

    private getTouchEventName(type: EventType): string {
        switch (type) {
            case EventType.ActionEnd:
                return "touchend";
            case EventType.ActionMove:
                return "touchmove";
            case EventType.ActionStart:
                return "touchstart"
        }
    }

    private getNullifiedEvent(event: SyntheticEvent): SyntheticEvent {
        Object.keys(event).forEach((key) => this.syntheticEvent[key] = null);
        return this.syntheticEvent;
    }

    private mouseToSynthetic(e: MouseEvent): SyntheticEvent {
        const event: SyntheticEvent = this.getNullifiedEvent(this.syntheticEvent);
        event.clientX = e.clientX;
        event.clientY = e.clientY;
        event.currentTarget = e.currentTarget;
        event.stopPropagation = e.stopPropagation.bind(e);
        event.target = e.target;
        return event;
    }

    private touchToSynthetic(e: TouchEvent): SyntheticEvent {
        const event: SyntheticEvent = this.getNullifiedEvent(this.syntheticEvent);
        event.clientX = e.touches[0].clientX;
        event.clientY = e.touches[0].clientY;
        event.currentTarget = e.currentTarget;
        event.stopPropagation = e.stopPropagation.bind(e);
        event.target = e.target;
        return event;
    }
}