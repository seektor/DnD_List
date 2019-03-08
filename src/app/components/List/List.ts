import { TCoordinates } from "../interfaces/TCoordinates";
import ListClassHooks, { TListClassHooks } from "./structures/ListClassHooks";
import ItemAttributeHooks, { TItemAttributeHooks } from "../templates/item/structures/ItemAttributeHooks";
import { TSwapData } from "./structures/TSwapData";
import { TListViewStatistics } from "./structures/TListViewStatistics";
import { IListHandlers } from "./interfaces/IListHandlers";
import { Writeable } from "../interfaces/Writeable";

/* TODO: 1. Assuming I would like to have elements with different heights, there are 2 problems:
    + The style.height property is being overwritten/cleared.
    + Some of the calculations are much faster because they rely on the fact that each element has the same height. For exampler
    calculations of the closest element.
*/
export class List {

    private listComponentElement: HTMLElement = null;
    private listElement: HTMLElement = null;
    private itemElementBase: HTMLElement = null;
    private draggedElement: HTMLElement = null;
    private pureDraggedElement: HTMLElement = null;
    private externalDraggedElement: HTMLElement = null;
    private placeholderElement: HTMLElement = null;

    private placeholderVerticalSpaceValue: number = 0;
    private initialCoordinates: TCoordinates = null;
    private initialScrollTop: number = 0;
    private filteredDomList: HTMLElement[] = [];
    private filteredListMap: number[] = [];
    private placeholderIndex: number = 0;
    private isDragging: boolean = false;
    private isDraggingFromExternalSource: boolean = false;

    private readonly listClassHooks: TListClassHooks = ListClassHooks;
    private readonly itemAttributeHooks: TItemAttributeHooks = ItemAttributeHooks;

    constructor(container: HTMLElement) {
        this.bindMethods();
        this.constructComponent(container);
    }

    private constructComponent(container: HTMLElement): void {
        this.placeholderElement = this.createPlaceholderElement();
        const listWrapperElement: HTMLElement = document.createElement("div");
        listWrapperElement.classList.add(this.listClassHooks.listWrapper);
        const listElement: HTMLElement = document.createElement("div");
        listElement.classList.add(this.listClassHooks.list, this.listClassHooks.listTranslateSmooth);
        listWrapperElement.append(listElement);
        this.listComponentElement = listWrapperElement;
        this.listElement = listElement;
        const itemTemplate: string = require("../templates/item/item.tpl.html");
        this.itemElementBase = document.createRange().createContextualFragment(itemTemplate).firstChild as HTMLElement;
        const items: HTMLElement[] = [];
        for (let i = 0; i <= 100; i++) {
            const item: HTMLElement = this.createItemElement(i.toString());
            items.push(item);
        }
        listElement.append(...items);
        container.appendChild(listWrapperElement);
    }

    private createItemElement(title: string): HTMLElement {
        const clonedItem: HTMLElement = this.itemElementBase.cloneNode(true) as HTMLElement;
        const titleElement: HTMLElement = clonedItem.querySelector(`[${this.itemAttributeHooks.itemTitle}]`);
        titleElement.innerHTML = `Item ${title}`;
        clonedItem.addEventListener("mousedown", this.onActionDown);
        clonedItem.addEventListener("mouseenter", this.onDragEnter);
        return clonedItem;
    }

    private bindMethods(): void {
        this.onActionDown = this.onActionDown.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnter = this.onDragEnter.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.toggleDropzone = this.toggleDropzone.bind(this);
        this.onExternalElementEnter = this.onExternalElementEnter.bind(this);
        this.onExternalElementLeave = this.onExternalElementLeave.bind(this);
        this.setExternalDraggedElement = this.setExternalDraggedElement.bind(this);
        this.toggleExternalElementAccessListener = this.toggleExternalElementAccessListener.bind(this);
        this.onDraggedElementTransitionEnd = this.onDraggedElementTransitionEnd.bind(this);
        this.onActionClick = this.onActionClick.bind(this);
        this.externalDragStop = this.externalDragStop.bind(this);
    }

    private createPlaceholderElement(): HTMLElement {
        const placeholderElement: HTMLElement = document.createElement("div");
        placeholderElement.addEventListener("mouseenter", this.onDragEnter);
        placeholderElement.classList.add(this.listClassHooks.itemPlaceholder);
        return placeholderElement;
    }

    private onActionDown(e: MouseEvent): void {
        if (this.isDragging) {
            return;
        }
        this.draggedElement = e.currentTarget as HTMLElement;
        this.initialCoordinates = { x: e.clientX, y: e.clientY };
        this.initialScrollTop = this.listComponentElement.scrollTop;
        document.addEventListener("mousemove", this.onDragStart);
        document.addEventListener("click", this.onActionClick);
    }

    private onDragStart(e: MouseEvent): void {
        console.log("dragStart");
        document.removeEventListener("mousemove", this.onDragStart);
        this.isDragging = true;
        this.listElement.classList.add(this.listClassHooks.listTranslateSmooth);
        this.placeholderVerticalSpaceValue = this.getElementVerticalSpaceValue(this.draggedElement);
        this.isDraggingFromExternalSource ? this.insertMachingPlaceholderOnExternalElementEnter(this.draggedElement) : this.insertMatchingPlaceholder(this.draggedElement);
        this.detachDraggedElement();
        // Placeholder is taking over the dragged element's index therefore the dragged element is removed from the index calculations.
        this.filteredDomList = ([...this.draggedElement.parentElement.children] as HTMLElement[])
            .filter(child => child !== this.draggedElement);
        this.filteredListMap = Array(this.filteredDomList.length).fill(1).map((_v, i) => i);
        this.placeholderIndex = this.filteredDomList.indexOf(this.placeholderElement);
        document.addEventListener("mousemove", this.onDragMove);
        document.addEventListener("mouseup", this.onDragEnd);
    }

    private lockElementBeforeDetach(): void {
        const draggedElementClientRect: ClientRect = this.draggedElement.getBoundingClientRect();
        this.draggedElement.style.top = `${draggedElementClientRect.top}px`;
        this.draggedElement.style.left = `${draggedElementClientRect.left}px`;
        this.draggedElement.style.width = `${this.draggedElement.offsetWidth}px`;
        this.draggedElement.style.height = `${this.draggedElement.offsetHeight}px`;
    }

    private getElementVerticalSpaceValue(element: HTMLElement): number {
        const computedStyles: CSSStyleDeclaration = window.getComputedStyle(element);
        return parseFloat(computedStyles.height) + parseFloat(computedStyles.marginBottom);
    }

    private onDragEnter(e: MouseEvent): void {
        console.log("dragEnter");

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
            const yItemTranslationValue: number = positionDiff * this.placeholderVerticalSpaceValue;
            yItemTranslationValue === 0 ?
                this.removeTranslation(itemElement) : this.setTranslation(itemElement, 0, yItemTranslationValue);
        });
        const yPlaceholderTranslationValue: number = (swapData.newPlaceholderPosition - this.placeholderIndex) * this.placeholderVerticalSpaceValue;
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

    private detachDraggedElement(): void {
        this.lockElementBeforeDetach();
        this.draggedElement.classList.add(this.listClassHooks.itemTranslateInstant);
        this.draggedElement.style.zIndex = `99999`;
        this.draggedElement.style.pointerEvents = "none";
        this.draggedElement.style.position = "fixed";
    }

    private attachDraggedElement(): void {
        this.draggedElement.classList.remove(this.listClassHooks.itemTranslateInstant);
        this.clearStyleProperties(this.draggedElement);
    }

    private clearStyleProperties(element: HTMLElement): void {
        element.style.zIndex = "";
        element.style.pointerEvents = "";
        element.style.width = "";
        element.style.height = "";
        element.style.position = "";
        element.style.top = "";
        element.style.left = "";
        this.removeTranslation(element);
    }

    private onDragMove(e: MouseEvent): void {
        e.preventDefault();
        const xTranslation: number = e.clientX - this.initialCoordinates.x;
        const yTranslation: number = e.clientY - this.initialCoordinates.y;
        this.setTranslation(this.draggedElement, xTranslation, yTranslation);
    }

    private onDragEnd(e: MouseEvent): void {
        document.removeEventListener("mousemove", this.onDragMove);
        document.removeEventListener("mouseup", this.onDragEnd);
        if (!this.isDragging) {
            return;
        }
        const viewStatistics: TListViewStatistics = this.getViewStatistics();
        this.adjustViewToPlaceholder(viewStatistics);
        this.draggedElement.addEventListener("transitionend", this.onDraggedElementTransitionEnd);
        this.pullElementToPlaceholder(viewStatistics);
    }

    private pullElementToPlaceholder(viewStatistics: TListViewStatistics): void {
        this.draggedElement.classList.remove(this.listClassHooks.itemTranslateInstant);
        let scrollTopDifference: number = 0;
        if (this.initialScrollTop !== viewStatistics.adjustedScrollTop) {
            scrollTopDifference = this.initialScrollTop - viewStatistics.adjustedScrollTop;
        }
        const placeholderYTranslation: number = (this.filteredListMap[this.placeholderIndex] - this.placeholderIndex) * this.placeholderVerticalSpaceValue;
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
            newScrollTop = this.filteredListMap[this.placeholderIndex] * this.placeholderVerticalSpaceValue;
        } else if (isBelowView) {
            newScrollTop = ((this.filteredListMap[this.placeholderIndex] + 1) * this.placeholderVerticalSpaceValue) - this.listComponentElement.clientHeight;
        }
        return {
            adjustedScrollTop: newScrollTop,
            isChildInView,
        }
    }

    private adjustViewToPlaceholder(viewStatistics: TListViewStatistics): void {
        if (!viewStatistics.isChildInView) {
            this.listComponentElement.scrollTo({ behavior: "smooth", top: viewStatistics.adjustedScrollTop });
        }
    }

    private onDraggedElementTransitionEnd(e: TransitionEvent): void {
        this.draggedElement.removeEventListener("transitionend", this.onDraggedElementTransitionEnd);
        this.listElement.classList.remove(this.listClassHooks.listTranslateSmooth);
        const fromPosition: number = this.placeholderIndex;
        const toPosition: number = this.filteredListMap[this.placeholderIndex];
        this.removePlaceholderAndTranslations(fromPosition, toPosition);
        if (this.isDraggingFromExternalSource) {
            this.onInsertNotifier(toPosition);
        } else {
            this.changeItemPosition(fromPosition, toPosition);
        }
        this.attachDraggedElement();
        this.onDropEnd();
    }

    private removePlaceholderAndTranslations(fromPosition: number, toPosition: number): void {
        const fromIndex: number = Math.min(fromPosition, toPosition);
        const toIndex: number = Math.max(fromPosition, toPosition);
        this.listElement.removeChild(this.placeholderElement);
        for (let i = fromIndex; i <= toIndex; i++) {
            this.removeTranslation(this.filteredDomList[i]);
        }
    }

    private onDropEnd(): void {
        this.clearTemporaryVariables(false);
        this.isDragging = false;
    }

    private cancelExternalDrag(): void {
        document.removeEventListener("mousemove", this.onDragStart);
        document.removeEventListener("mousemove", this.onDragMove);
        document.removeEventListener("mouseup", this.onDragEnd);
        document.removeEventListener("click", this.onActionClick);
        this.toggleElementVisibility(this.externalDraggedElement, true);
        const fromPosition: number = this.placeholderIndex;
        const toPosition: number = this.filteredListMap[this.placeholderIndex];
        this.removePlaceholderAndTranslations(fromPosition, toPosition);
        this.listElement.removeChild(this.draggedElement);
        this.draggedElement.remove();
        this.draggedElement = this.pureDraggedElement.cloneNode(true) as HTMLElement;
        this.clearTemporaryVariables(true);
    }

    private clearTemporaryVariables(preserveExternalDragData: boolean): void {
        this.filteredDomList = [];
        this.filteredListMap = [];
        this.placeholderIndex = 0;
        this.initialCoordinates = { x: 0, y: 0 };
        this.isDragging = false;
        this.placeholderVerticalSpaceValue = 0;
        this.initialScrollTop = 0;
        if (!preserveExternalDragData) {
            this.draggedElement = null;
            this.isDraggingFromExternalSource = false;
            this.externalDraggedElement = null;
        }
    }

    private onActionClick(e: MouseEvent): void {
        if (!this.isDragging) {
            document.removeEventListener("mousemove", this.onDragStart);
            const itemIndex: number = Array.from(this.listElement.children).indexOf(this.draggedElement);
            this.clearTemporaryVariables(false);
            this.onClickNotifier(itemIndex);
        }
    }

    public onClickNotifier(itemIndex: number): void {
        console.log(`CLICK: ${itemIndex}`);
    }

    public onSwapNotifier(from: number, to: number): void {
        console.log(`SWAP FROM ${from} TO ${to}`);
    }

    public onInsertNotifier(position: number): void {
        console.log(`INSERT ${position}`);
    }

    private changeItemPosition(fromIndex: number, toIndex: number): void {
        const beforeIndex: number = fromIndex < toIndex ? toIndex + 1 : toIndex;
        const child: Node = this.listElement.children.item(fromIndex);
        const toNode: Node = this.listElement.children.item(beforeIndex);
        this.listElement.insertBefore(child, toNode);
        this.onSwapNotifier(fromIndex, toIndex);
    }

    private removeTranslation(element: HTMLElement): void {
        element.style.transform = '';
    }

    private setTranslation(element: HTMLElement, x: number, y: number): void {
        element.style.transform = `translate(${x}px, ${y}px)`;
    }

    private insertMatchingPlaceholder(mirrorElement: HTMLElement): void {
        this.placeholderElement.style.height = `${mirrorElement.offsetHeight}px`;
        this.placeholderElement.style.width = `${mirrorElement.offsetWidth}px`;
        this.draggedElement.after(this.placeholderElement);
    }

    private insertMachingPlaceholderOnExternalElementEnter(mirrorElement: HTMLElement): void {
        this.placeholderElement.style.height = `${0}px`;
        this.placeholderElement.style.width = `${0}px`;
        this.draggedElement.after(this.placeholderElement);
        this.placeholderElement.style.height = `${mirrorElement.offsetHeight}px`;
        this.placeholderElement.style.width = `${mirrorElement.offsetWidth}px`;
    }

    private toggleElementVisibility(element: HTMLElement, isVisible: boolean): void {
        const newDisplay: string = isVisible ? "block" : "none";
        element.style.display = newDisplay;
    }

    private toggleDropzone(isEnabled: boolean): void {
        if (isEnabled) {
            this.listComponentElement.classList.add(this.listClassHooks.listHighlighted);
        } else {
            this.listComponentElement.classList.remove(this.listClassHooks.listHighlighted);
        }
    }

    private toggleExternalElementAccessListener(isEnabled: boolean): void {
        if (isEnabled) {
            this.listComponentElement.addEventListener("mouseenter", this.onExternalElementEnter);
            this.listComponentElement.addEventListener("mouseleave", this.onExternalElementLeave);
        } else {
            this.listComponentElement.removeEventListener("mouseenter", this.onExternalElementEnter);
            this.listComponentElement.removeEventListener("mouseleave", this.onExternalElementLeave);
        }
    }

    private onExternalElementEnter(e: MouseEvent): void {
        this.toggleElementVisibility(this.externalDraggedElement, false);
        this.isDraggingFromExternalSource = true;
        const firstListElement: HTMLElement = this.listElement.children.item(0) as HTMLElement;
        let insertBeforeItem: HTMLElement | undefined;
        if (firstListElement) {
            const listComponentElementClientRect: ClientRect = this.listComponentElement.getBoundingClientRect();
            const pointerInContainerHeight: number = e.clientY - listComponentElementClientRect.top;
            const itemVerticalSpaceValue: number = this.getElementVerticalSpaceValue(firstListElement);
            const scrollToPointerHeight: number = this.listComponentElement.scrollTop + pointerInContainerHeight;
            const firstVisibleIndex: number = Math.floor(scrollToPointerHeight / itemVerticalSpaceValue);
            insertBeforeItem = this.listElement.children.item(firstVisibleIndex) as HTMLElement | undefined;
        }
        this.listElement.insertBefore(this.draggedElement, insertBeforeItem);
        const preventDefaultRef: () => void = e.preventDefault.bind(e);
        const fakeDownEvent: Writeable<MouseEvent> = { ...e };
        const fakeMoveEvent: Writeable<MouseEvent> = { ...e };
        fakeDownEvent.preventDefault = preventDefaultRef;
        fakeMoveEvent.preventDefault = preventDefaultRef;
        const draggedElementClientRect: ClientRect = this.draggedElement.getBoundingClientRect();
        fakeDownEvent.clientX = draggedElementClientRect.left + draggedElementClientRect.width / 2;
        fakeDownEvent.clientY = draggedElementClientRect.top + draggedElementClientRect.height / 2;
        fakeDownEvent.currentTarget = this.draggedElement;
        fakeMoveEvent.clientX = e.clientX;
        fakeMoveEvent.clientY = e.clientY;
        fakeMoveEvent.currentTarget = this.draggedElement;
        this.onActionDown(fakeDownEvent);
        this.onDragMove(fakeMoveEvent);
    }

    private onExternalElementLeave(): void {
        this.cancelExternalDrag();
    }

    private setExternalDraggedElement(element: HTMLElement | null, title: string): void {
        this.externalDraggedElement = element;
        const newItemElement: HTMLElement = this.createItemElement(title);
        this.pureDraggedElement = newItemElement.cloneNode(true) as HTMLElement;
        this.draggedElement = newItemElement;
    }

    private externalDragStop(): void {
        if (!this.isDragging) {
            this.clearTemporaryVariables(false);
        }
    }

    public getListHandlers(): IListHandlers {
        return {
            toggleDropzone: this.toggleDropzone,
            toggleExternalElementAccessListener: this.toggleExternalElementAccessListener,
            setExternalDraggedElement: this.setExternalDraggedElement,
            externalDragStop: this.externalDragStop,
        }
    }
}