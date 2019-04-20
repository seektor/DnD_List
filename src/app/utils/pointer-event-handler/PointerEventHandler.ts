import { SyntheticEvent } from "./structures/SyntheticEvent";
import { PointerEventsMap } from "./structures/PointerEventsMap";
import { PointerEventType } from "./structures/PointerEventType";
import { SyntheticEventCallback, MouseEventCallback, TouchEventCallback } from "./structures/EventCallbacks";
import { PointerEventsMapCallbacks } from "./structures/PointerEventsMapCallback";

export class PointerEventHandler {

    private syntheticEvent: SyntheticEvent;
    private subscribersMap: Map<Node, Partial<PointerEventsMap>>;

    constructor() {
        this.syntheticEvent = this.createSyntheticEvent();
        this.subscribersMap = new Map();
    }

    private createSyntheticEvent(): SyntheticEvent {
        return {
            clientX: null,
            clientY: null,
            currentTarget: null,
            stopPropagation: null,
            target: null,
        }
    }

    public flushAll(): void {
        [...this.subscribersMap.keys()].forEach(element => {
            const eventsMap: Partial<PointerEventsMap> = this.subscribersMap.get(element);
            Object.keys(eventsMap).forEach(type => this.removeEventListenerByType(element, type as PointerEventType));
        })
    }

    public addEventListener(element: Node, type: PointerEventType, callback: SyntheticEventCallback): void {
        if (!this.subscribersMap.has(element)) {
            this.subscribersMap.set(element, {});
        }
        const eventsMap: PointerEventsMap = this.subscribersMap.get(element);
        if (!eventsMap[type]) {
            eventsMap[type] = [];
        }
        const callbacksObjects: PointerEventsMapCallbacks[] = eventsMap[type];
        const mouseEventName: string = this.getMouseEventName(type);
        const touchEventName: string = this.getTouchEventName(type);
        const mouseCallback: MouseEventCallback = (e: MouseEvent) => callback(this.mouseToSynthetic(e));
        const touchCallback: TouchEventCallback = (e: TouchEvent) => {
            e.preventDefault();
            callback(this.touchToSynthetic(e));
        };
        element.addEventListener(mouseEventName, mouseCallback);
        element.addEventListener(touchEventName, touchCallback);
        callbacksObjects.push({
            mouseCallback: mouseCallback,
            refCallback: callback,
            touchCallback: touchCallback
        });
    }

    public removeEventListenerByType(element: Node, type: PointerEventType): void {
        if (!this.subscribersMap.has(element)) {
            return;
        }
        const eventsMap: Partial<PointerEventsMap> = this.subscribersMap.get(element);
        if (!eventsMap[type]) {
            return;
        }
        const mouseEventName: string = this.getMouseEventName(type);
        const touchEventName: string = this.getTouchEventName(type);
        eventsMap[type].forEach(callbacks => {
            element.removeEventListener(mouseEventName, callbacks.mouseCallback);
            element.removeEventListener(touchEventName, callbacks.touchCallback);
        });
        delete eventsMap[type];
        if (Object.keys(eventsMap).length === 0) {
            this.subscribersMap.delete(element);
        }
    }

    public removeEventListener(element: Node, type: PointerEventType, callback: SyntheticEventCallback): void {
        if (!this.subscribersMap.has(element)) {
            return;
        }
        const eventsMap: Partial<PointerEventsMap> = this.subscribersMap.get(element);
        if (!eventsMap[type]) {
            return;
        }
        const eventsMapCallbacks: PointerEventsMapCallbacks[] = eventsMap[type];
        const matchingEventsMapCallbacks: PointerEventsMapCallbacks[] = eventsMapCallbacks.filter(callbacks => callbacks.refCallback === callback);
        const mouseEventName: string = this.getMouseEventName(type);
        const touchEventName: string = this.getTouchEventName(type);
        matchingEventsMapCallbacks.forEach((callbacks) => {
            element.removeEventListener(mouseEventName, callbacks.mouseCallback);
            element.removeEventListener(touchEventName, callbacks.touchCallback);
            eventsMapCallbacks.splice(eventsMapCallbacks.indexOf(callbacks, 1));
        });
        if (eventsMapCallbacks.length === 0) {
            this.subscribersMap.delete(element);
        }
    }

    private getMouseEventName(type: PointerEventType): string {
        switch (type) {
            case PointerEventType.ActionEnd:
                return "mouseup";
            case PointerEventType.ActionMove:
                return "mousemove";
            case PointerEventType.ActionStart:
                return "mousedown"
        }
    }

    private getTouchEventName(type: PointerEventType): string {
        switch (type) {
            case PointerEventType.ActionEnd:
                return "touchend";
            case PointerEventType.ActionMove:
                return "touchmove";
            case PointerEventType.ActionStart:
                return "touchstart"
        }
    }

    private nullifyEvent(event: SyntheticEvent) {
        Object.keys(event).forEach((key) => this.syntheticEvent[key] = null);
    }

    private mouseToSynthetic(e: MouseEvent): SyntheticEvent {
        this.nullifyEvent(this.syntheticEvent);
        this.syntheticEvent.clientX = e.clientX;
        this.syntheticEvent.clientY = e.clientY;
        this.syntheticEvent.currentTarget = e.currentTarget;
        this.syntheticEvent.stopPropagation = e.stopPropagation.bind(e);
        this.syntheticEvent.target = e.target;
        return this.syntheticEvent;
    }

    private touchToSynthetic(e: TouchEvent): SyntheticEvent {
        this.nullifyEvent(this.syntheticEvent);
        this.syntheticEvent.clientX = e.touches[0].clientX;
        this.syntheticEvent.clientY = e.touches[0].clientY;
        this.syntheticEvent.currentTarget = e.currentTarget;
        this.syntheticEvent.stopPropagation = e.stopPropagation.bind(e);
        this.syntheticEvent.target = e.target;
        return this.syntheticEvent;
    }
}