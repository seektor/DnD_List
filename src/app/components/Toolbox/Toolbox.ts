import ItemAttributeHooks from "../../viewport/Factories/ItemFactory/structures/ItemFactoryAttributeHooks";
import ToolboxClassHooks from "./structures/ToolboxClassHooks";
import { IListHandlers } from "../List/interfaces/IListHandlers";
import { TCoords } from "../../structures/TCoords";

export class Toolbox {

    private toolboxComponentElement: HTMLElement = null;
    private draggedElement: HTMLElement = null;
    private initialCoordinates: TCoords = null;
    private targetListHandlers: IListHandlers[] = [];

    constructor(container: HTMLElement) {
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.constructComponent(container);
    }

    private constructComponent(container: HTMLElement) {
        const toolboxWrapper: HTMLElement = document.createElement("div");
        toolboxWrapper.classList.add(ToolboxClassHooks.toolboxWrapper);
        this.toolboxComponentElement = toolboxWrapper;
        const itemTemplate: string = require("../templates/item/item.tpl.html");
        const itemElement: HTMLElement = document.createRange().createContextualFragment(itemTemplate).firstElementChild as HTMLElement;
        itemElement.classList.add(ToolboxClassHooks.toolboxItem);
        // const titleElement: HTMLElement = itemElement.querySelector(`[${this.itemAttributeHooks.itemTitle}]`);
        // titleElement.innerHTML = "Drag Me";
        itemElement.addEventListener("mousedown", this.onDragStart);
        toolboxWrapper.appendChild(itemElement);
        container.appendChild(toolboxWrapper);
    }

    public addTargetListHandlers(listHandlers: IListHandlers) {
        this.targetListHandlers.push(listHandlers);
    }

    private onDragStart(e: MouseEvent) {
        const originalElement: HTMLElement = (e.currentTarget as HTMLElement);
        this.draggedElement = originalElement.cloneNode(true) as HTMLElement;
        this.detachElement(originalElement);
        originalElement.after(this.draggedElement);
        this.initialCoordinates = { x: e.clientX, y: e.clientY };
        document.addEventListener("mousemove", this.onDragMove);
        document.addEventListener("mouseup", this.onDragEnd);
        this.targetListHandlers.forEach(targetListHandler => {
            targetListHandler.onExternalDragStart(this.draggedElement, this.draggedElement.cloneNode(true) as HTMLElement);
            targetListHandler.toggleDropzone(true);
        });
    }

    private detachElement(mirrorElement: HTMLElement) {
        const draggedElementClientRect: ClientRect = mirrorElement.getBoundingClientRect();
        this.draggedElement.style.top = `${draggedElementClientRect.top}px`;
        this.draggedElement.style.left = `${draggedElementClientRect.left}px`;
        this.draggedElement.style.width = `${mirrorElement.offsetWidth}px`;
        this.draggedElement.style.height = `${mirrorElement.offsetHeight}px`;
        this.draggedElement.style.zIndex = `${99999}`;
        this.draggedElement.style.pointerEvents = "none";
        this.draggedElement.style.position = "fixed";
    }

    private onDragMove(e: MouseEvent) {
        e.preventDefault();
        const xTranslation: number = e.clientX - this.initialCoordinates.x;
        const yTranslation: number = e.clientY - this.initialCoordinates.y;
        this.setTranslation(this.draggedElement, xTranslation, yTranslation);
    }

    private onDragEnd(e: MouseEvent) {
        document.removeEventListener("mousemove", this.onDragMove);
        document.removeEventListener("mouseup", this.onDragEnd);
        this.draggedElement.remove();
        this.draggedElement = null;
        this.targetListHandlers.forEach(targetListHandler => {
            targetListHandler.toggleDropzone(false);
        });
    }

    private setTranslation(element: HTMLElement, x: number, y: number) {
        element.style.transform = `translate(${x}px, ${y}px)`;
    }
}