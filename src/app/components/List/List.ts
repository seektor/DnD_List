import { TCoordinates } from "../interfaces/TCoordinates";
import ListClassHooks, { TListClassHooks } from "./structures/ListClassHooks";
import ItemAttributeHooks, { TItemAttributeHooks } from "../templates/item/structures/ItemAttributeHooks";
import { TSwapData } from "./structures/TSwapData";
import { TListViewStatistics } from "./structures/TListViewStatistics";

export class List {

    private listComponentElement: HTMLElement = null;
    private listElement: HTMLElement = null;
    private draggedElement: HTMLElement = null;
    private placeholderElement: HTMLElement = null;

    private draggedVerticalSpaceValue: number = 0;
    private initialCoordinates: TCoordinates = null;
    private initialScrollTop: number = 0;
    private filteredDomList: HTMLElement[] = [];
    private filteredListMap: number[] = [];
    private placeholderIndex: number = 0;
    private isDragging: boolean = false;

    private readonly listClassHooks: TListClassHooks = ListClassHooks;
    private readonly itemAttributeHooks: TItemAttributeHooks = ItemAttributeHooks;

    constructor(container: HTMLElement) {
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDraggedElementTransitionEnd = this.onDraggedElementTransitionEnd.bind(this);
        this.constructComponent(container);
    }

    private constructComponent(container: HTMLElement) {
        this.placeholderElement = this.createPlaceholderElement();
        const listWrapperElement: HTMLElement = document.createElement("div");
        listWrapperElement.classList.add(this.listClassHooks.listWrapper);
        const listElement: HTMLElement = document.createElement("div");
        listElement.classList.add(this.listClassHooks.list, this.listClassHooks.listTranslateSmooth);
        listWrapperElement.append(listElement);
        this.listComponentElement = listWrapperElement;
        this.listElement = listElement;
        const itemTemplate: string = require("../templates/item/item.tpl.html");
        const itemFragment: DocumentFragment = document.createRange().createContextualFragment(itemTemplate);
        const items: HTMLElement[] = [];
        for (let i = 0; i <= 100; i++) {
            const clonedItem: HTMLElement = itemFragment.cloneNode(true).firstChild as HTMLElement;
            const titleElement: HTMLElement = clonedItem.querySelector(`[${this.itemAttributeHooks.itemTitle}]`);
            titleElement.innerHTML = `Item ${i}`;
            this.decorateDragElement(clonedItem);
            items.push(clonedItem);
        }
        listElement.append(...items);
        container.appendChild(listWrapperElement);
    }

    private createPlaceholderElement(): HTMLElement {
        const placeholderElement: HTMLElement = document.createElement("div");
        placeholderElement.addEventListener("mouseenter", this.onDragEnter);
        placeholderElement.classList.add(this.listClassHooks.itemPlaceholder);
        return placeholderElement;
    }

    private decorateDragElement(element: HTMLElement) {
        element.addEventListener("mousedown", this.onDragStart);
        element.addEventListener("mouseenter", this.onDragEnter);
    }

    private onDragStart(e: MouseEvent) {
        if (this.isDragging) {
            return;
        }
        this.listElement.classList.add(this.listClassHooks.listTranslateSmooth);
        this.draggedElement = e.currentTarget as HTMLElement;
        this.initialCoordinates = { x: e.clientX, y: e.clientY };
        this.initialScrollTop = this.listComponentElement.scrollTop;
        this.draggedVerticalSpaceValue = this.getDraggedElementVerticalSpaceValue();
        this.lockElementBeforeDetach();
        this.insertMatchingPlaceholder(this.draggedElement);
        // Placeholder is taking over the dragged element's index therefore the dragged element is removed from the index calculations.
        this.filteredDomList = ([...this.draggedElement.parentElement.children] as HTMLElement[])
            .filter(child => child !== this.draggedElement);
        this.filteredListMap = Array(this.filteredDomList.length).fill(1).map((_v, i) => i);
        this.placeholderIndex = this.filteredDomList.indexOf(this.placeholderElement);
        this.detachDraggedElement();
        document.addEventListener("mousemove", this.onDragMove);
        document.addEventListener("mouseup", this.onDragEnd);
        this.isDragging = true;
    }

    private lockElementBeforeDetach() {
        const draggedElementClientRect: ClientRect = this.draggedElement.getBoundingClientRect();
        this.draggedElement.style.top = `${draggedElementClientRect.top}px`;
        this.draggedElement.style.left = `${draggedElementClientRect.left}px`;
        this.draggedElement.style.width = `${this.draggedElement.offsetWidth}px`;
        this.draggedElement.style.height = `${this.draggedElement.offsetHeight}px`;
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
        swapData.affectedItemIndexes.forEach(i => {
            this.filteredListMap[i] += swapData.affectedItemsPositionIncrementation;
            const positionDiff: number = this.filteredListMap[i] - i;
            const itemElement: HTMLElement = this.filteredDomList[i];
            const yItemTranslationValue: number = positionDiff * this.draggedVerticalSpaceValue;
            yItemTranslationValue === 0 ?
                this.removeTranslation(itemElement) : this.setTranslation(itemElement, 0, yItemTranslationValue);
        });
        const yPlaceholderTranslationValue: number = (swapData.newPlaceholderPosition - this.placeholderIndex) * this.draggedVerticalSpaceValue;
        this.setTranslation(this.placeholderElement, 0, yPlaceholderTranslationValue);
        this.filteredListMap[this.placeholderIndex] = swapData.newPlaceholderPosition;
    }

    // TODO: This algorithm (indexOf) or the whole listMap structure can be improved to avoid indexOf.
    private buildSwapData(draggedOverElement: HTMLElement): TSwapData {
        const draggedOverElementIndex: number = this.filteredDomList.indexOf(draggedOverElement);
        const fromPosition: number = this.filteredListMap[this.placeholderIndex];
        const toPosition: number = this.filteredListMap[draggedOverElementIndex];
        let affectedItemsPositionIncrementation: number
        if (toPosition > fromPosition) {
            affectedItemsPositionIncrementation = -1;
        } else if (toPosition === fromPosition) {
            affectedItemsPositionIncrementation = 0;
        } else {
            affectedItemsPositionIncrementation = 1;
        }
        const positionDifference: number = Math.abs(toPosition - fromPosition);
        const firstPosition: number = Math.min(fromPosition, toPosition);
        const minPosition: number = toPosition >= fromPosition ? firstPosition + 1 : firstPosition;
        const affectedItemIndexes: number[] = new Array(positionDifference).fill(0)
            .map((_ai, i) => this.filteredListMap.indexOf(i + minPosition));
        const newPlaceholderPosition: number = toPosition;
        return {
            affectedItemIndexes,
            affectedItemsPositionIncrementation,
            newPlaceholderPosition,
        }
    }

    private detachDraggedElement() {
        this.draggedElement.classList.add(this.listClassHooks.itemTranslateInstant);
        this.draggedElement.style.zIndex = `99999`;
        this.draggedElement.style.pointerEvents = "none";
        this.draggedElement.style.position = "fixed";
    }

    private attachDraggedElement() {
        this.draggedElement.classList.remove(this.listClassHooks.itemTranslateInstant);
        this.draggedElement.style.zIndex = "";
        this.draggedElement.style.pointerEvents = "";
        this.draggedElement.style.width = "";
        this.draggedElement.style.height = "";
        this.draggedElement.style.position = "";
        this.draggedElement.style.top = "";
        this.draggedElement.style.left = "";
        this.removeTranslation(this.draggedElement);
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
        const viewStatistics: TListViewStatistics = this.getViewStatistics();
        this.adjustViewToPlaceholder(viewStatistics);
        this.draggedElement.addEventListener("transitionend", this.onDraggedElementTransitionEnd);
        this.pullElementToPlaceholder(viewStatistics);
    }

    private pullElementToPlaceholder(viewStatistics: TListViewStatistics) {
        this.draggedElement.classList.remove(this.listClassHooks.itemTranslateInstant);
        let scrollTopDifference: number = 0;
        if (this.initialScrollTop !== viewStatistics.adjustedScrollTop) {
            scrollTopDifference = this.initialScrollTop - viewStatistics.adjustedScrollTop;
        }
        const placeholderYTranslation: number = (this.filteredListMap[this.placeholderIndex] - this.placeholderIndex) * this.draggedVerticalSpaceValue;
        const yTranslationWithScroll: number = placeholderYTranslation + scrollTopDifference;
        this.setTranslation(this.draggedElement, 0, yTranslationWithScroll);
    }

    private getViewStatistics(): TListViewStatistics {
        const listWrapperClientRect: ClientRect = this.listComponentElement.getBoundingClientRect();
        const placeholderClientRect: ClientRect = this.placeholderElement.getBoundingClientRect();
        const isAboveView: boolean = placeholderClientRect.top < listWrapperClientRect.top;
        const isBelowView: boolean = placeholderClientRect.top + placeholderClientRect.height > listWrapperClientRect.top + listWrapperClientRect.height;
        const isChildInView: boolean = !isAboveView && !isBelowView;
        let newScrollTop: number = this.listComponentElement.scrollTop;
        if (isAboveView) {
            newScrollTop = this.filteredListMap[this.placeholderIndex] * this.draggedVerticalSpaceValue;
        } else if (isBelowView) {
            newScrollTop = ((this.filteredListMap[this.placeholderIndex] + 1) * this.draggedVerticalSpaceValue) - this.listComponentElement.clientHeight;
        }
        return {
            adjustedScrollTop: newScrollTop,
            isChildInView,
        }
    }

    private adjustViewToPlaceholder(viewStatistics: TListViewStatistics) {
        if (!viewStatistics.isChildInView) {
            this.listComponentElement.scrollTo({ behavior: "smooth", top: viewStatistics.adjustedScrollTop });
        }
    }

    private onDraggedElementTransitionEnd(e: TransitionEvent) {
        this.draggedElement.removeEventListener("transitionend", this.onDraggedElementTransitionEnd);
        this.listElement.classList.remove(this.listClassHooks.listTranslateSmooth);
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
        this.initialScrollTop = 0;
        this.isDragging = false;
    }

    private changeItemPosition(fromIndex: number, toIndex: number) {
        const beforeIndex: number = fromIndex < toIndex ? toIndex + 1 : toIndex;
        const child: Node = this.listElement.children.item(fromIndex);
        const toNode: Node = this.listElement.children.item(beforeIndex);
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