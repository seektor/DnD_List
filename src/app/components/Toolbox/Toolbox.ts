import { IListHandlers } from "../List/interfaces/IListHandlers";
import { TCoords } from "../../structures/TCoords";
import { Utils } from "../../utils/Utils";
import ToolboxAttributeHooks from "./structures/ToolboxAttributeHooks";
import { ToolboxItemFactory } from "./factories/ToolboxItemFactory/ToolboxItemFactory";
import { PointerEventHandler } from "../../utils/pointer-event-handler/PointerEventHandler";
import { PointerEventType } from "../../utils/pointer-event-handler/structures/PointerEventType";

export class Toolbox {

    private listElement: HTMLElement;
    private draggedElement: HTMLElement = null;
    private initialCoordinates: TCoords = null;
    private pointerEventHandler: PointerEventHandler;

    constructor(container: HTMLElement) {
        this.constructComponent(container);
        this.pointerEventHandler = new PointerEventHandler();
        this.bindMethods();
    }

    public dispose(): void {
        this.pointerEventHandler.flushAll();
    }

    private bindMethods(): void {
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    private constructComponent(container: HTMLElement): void {
        const template: string = require("./toolbox.tpl.html");
        const toolboxElement: HTMLElement = Utils.createElementFromTemplate(template);
        this.listElement = Utils.getElementByAttribute(toolboxElement, ToolboxAttributeHooks.list);
        container.append(toolboxElement);
    }

    public addItem(title: string): void {
        const item: HTMLElement = ToolboxItemFactory(title);
        this.pointerEventHandler.addEventListener(item, PointerEventType.ActionStart, this.onDragStart);
        this.listElement.append(item);
    }

    private onDragStart(e: MouseEvent): void {
        this.initialCoordinates = { x: e.clientX, y: e.clientY };
        const originalElement: HTMLElement = (e.currentTarget as HTMLElement);
        this.draggedElement = originalElement.cloneNode(true) as HTMLElement;
        this.detachElement(originalElement);
        originalElement.after(this.draggedElement);
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, this.onDragMove);
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionEnd, this.onDragEnd);
    }

    private detachElement(element: HTMLElement): void {
        const draggedElementClientRect: ClientRect = element.getBoundingClientRect();
        this.draggedElement.style.top = `${draggedElementClientRect.top}px`;
        this.draggedElement.style.left = `${draggedElementClientRect.left}px`;
        this.draggedElement.style.width = `${element.clientWidth}px`;
        this.draggedElement.style.height = `${element.clientHeight}px`;
        this.draggedElement.style.zIndex = `${99999}`;
        this.draggedElement.style.pointerEvents = "none";
        this.draggedElement.style.position = "fixed";
    }

    private onDragMove(event: MouseEvent): void {
        const xTranslation: number = event.clientX - this.initialCoordinates.x;
        const yTranslation: number = event.clientY - this.initialCoordinates.y;
        this.setTranslation(this.draggedElement, xTranslation, yTranslation);
    }

    private onDragEnd(event: MouseEvent): void {
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionMove, this.onDragMove);
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionEnd, this.onDragEnd);
        this.pointerEventHandler.removeEventListener(this.draggedElement, PointerEventType.ActionStart, this.onDragStart);
        this.draggedElement.remove();
        this.draggedElement = null;
    }

    private setTranslation(element: HTMLElement, x: number, y: number): void {
        element.style.transform = `translate(${x}px, ${y}px)`;
    }
}