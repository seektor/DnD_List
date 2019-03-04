import { TCoordinates } from "../interfaces/TCoordinates";
import ListClassHooks, { TListClassHooks } from "./structures/ListClassHooks";
import ItemAttributeHooks, { TItemAttributeHooks } from "../templates/item/structures/ItemAttributeHooks";
import { TSwapData } from "./structures/TSwapData";
import { DraggedItemLocation } from "./structures/DraggedItemLocation";

export class List {

    private listElement: HTMLElement = null;
    private draggedElement: HTMLElement = null;
    private placeholderElement: HTMLElement = null;

    private draggedVerticalSpaceValue: number = 0;
    private initialCoordinates: TCoordinates = null;
    private filteredDomList: HTMLElement[] = [];
    private filteredListMap: number[] = [];
    private placeholderIndex: number = 0;
    private isDragging: boolean = false;

    private readonly listClassHooks: TListClassHooks = ListClassHooks;
    private readonly itemAttributeHooks: TItemAttributeHooks = ItemAttributeHooks;

    constructor(container: HTMLElement) {
        this.onDragStart = this.onDragStart.bind(this);
        this.onDrag = this.onDrag.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDraggedElementTransitionEnd = this.onDraggedElementTransitionEnd.bind(this);
        this.constructComponent(container);
    }

    private constructComponent(container: HTMLElement) {
        this.placeholderElement = this.createPlaceholderElement();
        const listWrapper: HTMLElement = document.createElement("div");
        this.listElement = listWrapper;
        listWrapper.classList.add(this.listClassHooks.listWrapper, this.listClassHooks.listWrapperTranslateSmooth);
        const itemTemplate: string = require("../templates/item/item.tpl.html");
        const itemFragment: DocumentFragment = document.createRange().createContextualFragment(itemTemplate);
        const items: HTMLElement[] = [];
        for (let i = 0; i <= 100; i++) {
            const clonedItem: HTMLElement = itemFragment.cloneNode(true).firstChild as HTMLElement;
            const titleElement: HTMLElement = clonedItem.querySelector(`[${this.itemAttributeHooks.itemTitle}]`);
            titleElement.innerHTML = `Item ${i}`;
            this.decorateDragData(clonedItem);
            items.push(clonedItem);
        }
        listWrapper.append(...items);
        container.appendChild(listWrapper);
    }

    private createPlaceholderElement(): HTMLElement {
        const placeholderElement: HTMLElement = document.createElement("div");
        placeholderElement.addEventListener("mouseenter", this.onDragEnter);
        placeholderElement.classList.add(this.listClassHooks.itemPlaceholder);
        return placeholderElement;
    }

    private decorateDragData(item: HTMLElement) {
        item.addEventListener("mousedown", this.onDragStart);
        item.addEventListener("mouseenter", this.onDragEnter);
    }

    private onDragStart(e: MouseEvent) {
        if (this.isDragging) {
            return;
        }
        this.listElement.classList.add(this.listClassHooks.listWrapperTranslateSmooth);
        this.draggedElement = e.currentTarget as HTMLElement;
        this.initialCoordinates = { x: e.clientX, y: e.clientY };
        this.draggedVerticalSpaceValue = this.getDraggedElementVerticalSpaceValue();
        this.insertMatchingPlaceholder(this.draggedElement);
        // Placeholder is taking over the dragged element's index therefore the dragged element is removed from the index calculations.
        this.filteredDomList = ([...this.draggedElement.parentElement.children] as HTMLElement[])
            .filter(child => child !== this.draggedElement);
        this.filteredListMap = Array(this.filteredDomList.length).fill(1).map((_v, i) => i);
        this.placeholderIndex = this.filteredDomList.indexOf(this.placeholderElement);
        this.detachDraggedElement();
        document.addEventListener("mousemove", this.onDrag);
        document.addEventListener("mouseup", this.onDragEnd);
        this.isDragging = true;
    }

    private getDraggedElementVerticalSpaceValue(): number {
        const computedStyles: CSSStyleDeclaration = window.getComputedStyle(this.draggedElement);
        return parseFloat(computedStyles.height) + parseFloat(computedStyles.marginBottom);
    }

    private onDragEnter(e: MouseEvent) {
        if (!this.isDragging) {
            return;
        }
        const draggedOverElement: HTMLElement = e.target as HTMLElement;
        if (draggedOverElement === this.placeholderElement) {
            return;
        }
        const swapData: TSwapData = this.buildSwapData(draggedOverElement);
        for (let i = swapData.fromAffectedItemIndex; i <= swapData.toAffectedItemIndex; i++) {
            this.filteredListMap[i] += swapData.affectedItemsPositionIncrementation;
            const positionDiff: number = this.filteredListMap[i] - i;
            const itemElement: HTMLElement = this.filteredDomList[i];
            const yItemTranslationValue: number = positionDiff * this.draggedVerticalSpaceValue;
            yItemTranslationValue === 0 ?
                this.removeTranslation(itemElement) : this.setTranslation(itemElement, 0, yItemTranslationValue);
        }
        const yPlaceholderTranslationValue: number = (swapData.newPlaceholderPosition - this.placeholderIndex) * this.draggedVerticalSpaceValue;
        this.setTranslation(this.placeholderElement, 0, yPlaceholderTranslationValue);
        this.filteredListMap[this.placeholderIndex] = swapData.newPlaceholderPosition;
    }

    private getPositionIncrementation(draggedItemPosition: DraggedItemLocation): number {
        switch (draggedItemPosition) {
            case DraggedItemLocation.After:
                return -1;
            case DraggedItemLocation.Over:
                return 0;
            case DraggedItemLocation.Before:
                return 1;
        }
    }

    private buildSwapData(draggedOverElement: HTMLElement): TSwapData {
        const draggedOverElementIndex: number = this.filteredDomList.indexOf(draggedOverElement);
        const placeholderPosition: number = this.filteredListMap[this.placeholderIndex];
        const draggedOverPosition: number = this.filteredListMap[draggedOverElementIndex];
        let draggedItemLocation: DraggedItemLocation;
        if (draggedOverPosition > placeholderPosition) {
            draggedItemLocation = DraggedItemLocation.After;
        } else if (draggedOverPosition === placeholderPosition) {
            draggedItemLocation = DraggedItemLocation.Over;
        } else {
            draggedItemLocation = DraggedItemLocation.Before;
        }
        let fromItemAtPosition: number;
        let toItemAtPosition: number;
        switch (draggedItemLocation) {
            case DraggedItemLocation.Before:
                fromItemAtPosition = draggedOverPosition;
                toItemAtPosition = placeholderPosition - 1;
                break;
            case DraggedItemLocation.Over:
                fromItemAtPosition = placeholderPosition;
                toItemAtPosition = placeholderPosition;
                break;
            case DraggedItemLocation.After:
                fromItemAtPosition = placeholderPosition + 1;
                toItemAtPosition = draggedOverPosition;
                break;
        }
        const itemsLength: number = Math.abs(toItemAtPosition - fromItemAtPosition);
        const fromAffectedItemIndex: number = this.filteredListMap.indexOf(fromItemAtPosition);
        const toAffectedItemIndex: number = fromAffectedItemIndex + itemsLength;
        const newPlaceholderPosition: number = draggedOverPosition;
        const affectedItemsPositionIncrementation: number = this.getPositionIncrementation(draggedItemLocation);
        return {
            fromAffectedItemIndex,
            affectedItemsPositionIncrementation,
            toAffectedItemIndex,
            newPlaceholderPosition,
        }
    }

    private detachDraggedElement() {
        this.draggedElement.classList.add(this.listClassHooks.itemTranslateInstant);
        this.draggedElement.style.zIndex = `99999`;
        this.draggedElement.style.pointerEvents = "none";
        this.draggedElement.style.width = `${this.draggedElement.offsetWidth}px`;
        this.draggedElement.style.height = `${this.draggedElement.offsetHeight}px`;
        this.draggedElement.style.position = "absolute";
    }

    private attachDraggedElement() {
        this.draggedElement.classList.remove(this.listClassHooks.itemTranslateInstant);
        this.draggedElement.style.zIndex = "";
        this.draggedElement.style.pointerEvents = "";
        this.draggedElement.style.width = "";
        this.draggedElement.style.height = "";
        this.draggedElement.style.position = "";
        this.removeTranslation(this.draggedElement);
    }

    private onDrag(e: MouseEvent) {
        e.preventDefault();
        const xTranslation: number = e.clientX - this.initialCoordinates.x;
        const yTranslation: number = e.clientY - this.initialCoordinates.y;
        this.setTranslation(this.draggedElement, xTranslation, yTranslation);
    }

    private onDragEnd(e: MouseEvent) {
        document.removeEventListener("mousemove", this.onDrag);
        document.removeEventListener("mouseup", this.onDragEnd);
        this.draggedElement.classList.remove(this.listClassHooks.itemTranslateInstant);
        this.draggedElement.addEventListener("transitionend", this.onDraggedElementTransitionEnd);
        this.draggedElement.style.transform = this.placeholderElement.style.transform;
    }

    private onDraggedElementTransitionEnd(e: TransitionEvent) {
        this.draggedElement.removeEventListener("transitionend", this.onDraggedElementTransitionEnd);
        this.listElement.classList.remove(this.listClassHooks.listWrapperTranslateSmooth);
        const fromPosition: number = this.placeholderIndex;
        const toPosition: number = this.filteredListMap[this.placeholderIndex];
        const fromIndex: number = Math.min(fromPosition, toPosition);
        const toIndex: number = Math.max(fromPosition, toPosition);
        this.listElement.removeChild(this.placeholderElement);
        for (let i = fromIndex; i <= toIndex; i++) {
            this.removeTranslation(this.filteredDomList[i]);
        }
        this.changeItemPosition(fromPosition, toPosition);
        this.attachDraggedElement();
        this.onDropEnd();
    }

    private onDropEnd() {
        this.filteredDomList = [];
        this.filteredListMap = [];
        this.placeholderIndex = 0;
        this.initialCoordinates = { x: 0, y: 0 };
        this.draggedElement = null;
        this.draggedVerticalSpaceValue = 0;
        this.isDragging = false;
    }

    private changeItemPosition(fromIndex: number, toIndex: number) {
        const child: Node = this.listElement.children.item(fromIndex);
        const toNode: Node = this.listElement.children.item(toIndex + 1);
        this.listElement.insertBefore(child, toNode);
    }

    private removeTranslation(element: HTMLElement) {
        element.style.transform = '';
    }

    private setTranslation(element: HTMLElement, x: number, y: number) {
        element.style.transform = `translate(${x}px, ${y}px)`;
    }

    private insertMatchingPlaceholder(mirrorElement: HTMLElement) {
        this.placeholderElement.style.height = `${mirrorElement.offsetHeight}px`;
        this.placeholderElement.style.width = `${mirrorElement.offsetWidth}px`;
        this.draggedElement.after(this.placeholderElement);
    }
}