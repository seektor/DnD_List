import { TCoords } from '../../../common/structures/TCoords';
import { PointerEventHandler } from '../../../common/utils/pointer-event-handler/PointerEventHandler';
import { PointerEventType } from '../../../common/utils/pointer-event-handler/structures/PointerEventType';
import { Utils } from '../../../common/utils/Utils';
import { IGridHandlers } from '../../../Grid/interfaces/IGridHandlers';
import { ToolboxItemFactory } from './factories/ToolboxItemFactory/ToolboxItemFactory';
import ToolboxAttributeHooks from './structures/ToolboxAttributeHooks';
import { TToolboxItem } from './structures/TToolboxItem';

export class Toolbox {

    private listElement: HTMLElement;
    private originalDraggedElement: HTMLElement = null;
    private draggedElement: HTMLElement = null;
    private initialCoordinates: TCoords = null;
    private pointerEventHandler: PointerEventHandler;
    private toolboxItems: WeakMap<HTMLElement, TToolboxItem>;

    constructor(container: HTMLElement) {
        this.constructComponent(container);
        this.pointerEventHandler = new PointerEventHandler();
        this.toolboxItems = new WeakMap();
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
        const template: string = require('./toolbox.tpl.html');
        const toolboxElement: HTMLElement = Utils.createElementFromTemplate(template);
        this.listElement = Utils.getElementByAttribute(toolboxElement, ToolboxAttributeHooks.list);
        container.append(toolboxElement);
    }

    public addItem(title: string, dropContent: HTMLElement, dropCallbacks: IGridHandlers): void {
        const item: HTMLElement = ToolboxItemFactory(title);
        this.pointerEventHandler.addEventListener(item, PointerEventType.ActionStart, this.onDragStart);
        this.toolboxItems.set(item, {
            dropzoneCallbacks: dropCallbacks,
            dropzoneContent: dropContent
        });
        this.listElement.append(item);
    }

    private onDragStart(e: MouseEvent): void {
        this.initialCoordinates = { x: e.clientX, y: e.clientY };
        this.originalDraggedElement = (e.currentTarget as HTMLElement);
        this.draggedElement = this.originalDraggedElement.cloneNode(true) as HTMLElement;
        this.detachElement(this.originalDraggedElement);
        this.originalDraggedElement.after(this.draggedElement);
        const toolboxItem: TToolboxItem = this.toolboxItems.get(this.originalDraggedElement);
        toolboxItem.dropzoneCallbacks.toggleDropzone(true);
        toolboxItem.dropzoneCallbacks.onExternalDragStart(this.draggedElement, toolboxItem.dropzoneContent.cloneNode(true) as HTMLElement, (i) => console.log(`Insert ${i}`));
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, this.onDragMove);
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionEnd, this.onDragEnd);
    }

    private detachElement(mirrorElement: HTMLElement): void {
        const draggedElementClientRect: ClientRect = mirrorElement.getBoundingClientRect();
        this.draggedElement.style.top = `${draggedElementClientRect.top}px`;
        this.draggedElement.style.left = `${draggedElementClientRect.left}px`;
        this.draggedElement.style.width = `${mirrorElement.clientWidth}px`;
        this.draggedElement.style.height = `${mirrorElement.clientHeight}px`;
        this.draggedElement.style.zIndex = `${99999}`;
        this.draggedElement.style.pointerEvents = 'none';
        this.draggedElement.style.position = 'fixed';
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
        const toolboxItem: TToolboxItem = this.toolboxItems.get(this.originalDraggedElement);
        toolboxItem.dropzoneCallbacks.toggleDropzone(false);
        this.draggedElement.remove();
        this.draggedElement = null;
        this.originalDraggedElement = null;
        toolboxItem.dropzoneCallbacks.onExternalDragEnd();
    }

    private setTranslation(element: HTMLElement, x: number, y: number): void {
        element.style.transform = `translate(${x}px, ${y}px)`;
    }
}