import ListClassHooks, { TListClassHooks } from "./structures/ListClassHooks";
import ItemAttributeHooks, { TItemAttributeHooks } from "../templates/item/structures/ItemAttributeHooks";
import { TPositionChangeData } from "./structures/TPositionChangeData";
import { TListViewStatistics } from "./structures/TListViewStatistics";
import { IListHandlers } from "./interfaces/IListHandlers";
import { TWriteable } from "../interfaces/TWriteable";
import { TDragStartData } from "./structures/TDragStartData";
import { DragMode } from "./structures/DragMode";
import { smoothScroll } from "../../utils/smooth-scroll/smoothScroll";

/* TODO: There is still a bug with a "dead scroll". Repro: Drag an element but stay on the placeholder position. Then scroll using wheel until the placeholder is vanished from view. Then DO NOT move the mouse. The return animation is invalid. It happens because before mouseUp is triggered the mouseEnter is triggered on the element below the cursor. Then probably during mouseUp calculations the positionChange transition is not done yet which leads to invalid calculations.
*/
export class List {

    private listComponentElement: HTMLElement = null;
    private listElement: HTMLElement = null;
    private itemElementCloneBase: HTMLElement = null;
    private draggedElement: HTMLElement = null;
    private placeholderElement: HTMLElement = null;

    private pureDraggedElement: HTMLElement = null;
    private externalDraggedElement: HTMLElement = null;

    private placeholderVerticalSpaceValue: number = 0;
    private dragStartData: TDragStartData = null;
    private dragMode: DragMode = DragMode.None;
    private filteredDomList: HTMLElement[] = [];
    private filteredListMap: number[] = [];
    private placeholderIndex: number = 0;
    private isDragging: boolean = false;
    private isDraggingFromExternalSource: boolean = false;

    private readonly listClassHooks: TListClassHooks = ListClassHooks;
    private readonly itemAttributeHooks: TItemAttributeHooks = ItemAttributeHooks;
    // This property (in ms) has to match with the css translate time
    private readonly TRANSLATE_TIME: number = 200;
    // Same for the margin
    private readonly ITEM_MARGIN_BOTTOM: number = 10;

    constructor(container: HTMLElement) {
        this.bindMethods();
        this.constructComponent(container);
    }

    private constructComponent(container: HTMLElement): void {
        this.placeholderElement = this.createPlaceholderElement();
        this.listComponentElement = document.createElement("div");
        this.listComponentElement.classList.add(this.listClassHooks.listComponent);
        this.listElement = document.createElement("div");
        this.listElement.classList.add(this.listClassHooks.list, this.listClassHooks.listTranslateSmooth);
        this.listComponentElement.append(this.listElement);
        const itemTemplate: string = require("./templates/list-item.html");
        const testContentTemplate: string = require("../templates/item/item.tpl.html");
        this.itemElementCloneBase = document.createRange().createContextualFragment(itemTemplate).firstChild as HTMLElement;
        const testContentElement: HTMLElement = document.createRange().createContextualFragment(testContentTemplate).firstChild as HTMLElement;
        const listItems: HTMLElement[] = [];
        for (let i = 0; i <= 100; i++) {
            const clonedTestContentElement: HTMLElement = testContentElement.cloneNode(true) as HTMLElement;
            this.decorateContentElement(clonedTestContentElement, i.toString());
            const item: HTMLElement = this.createItemElement(clonedTestContentElement);
            listItems.push(item);
        }
        this.listElement.append(...listItems);
        container.appendChild(this.listComponentElement);
    }

    private decorateContentElement(contentElement: HTMLElement, title: string): HTMLElement {
        const titleElement: HTMLElement = contentElement.querySelector(`[${this.itemAttributeHooks.itemTitle}]`);
        titleElement.innerHTML = `Item ${title}`;
        return contentElement;
    }

    private createItemElement(contentElement: HTMLElement): HTMLElement {
        const clonedItemElement: HTMLElement = this.itemElementCloneBase.cloneNode(true) as HTMLElement;
        contentElement.style.height = `${Math.floor(Math.random() * 40 + 60)}px`;
        clonedItemElement.addEventListener("mousedown", this.onActionDown);
        clonedItemElement.addEventListener("mouseenter", this.onDragEnter);
        clonedItemElement.appendChild(contentElement);
        return clonedItemElement;
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
        this.onDraggedElementPulled = this.onDraggedElementPulled.bind(this);
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
        this.dragStartData = {
            initialCoordinates: { x: e.clientX, y: e.clientY },
            initialComponentScrollTop: this.listComponentElement.scrollTop,
            initialComponentTop: this.listComponentElement.getBoundingClientRect().top,
        }
        this.dragMode = DragMode.Internal;
        document.addEventListener("mousemove", this.onDragStart);
        document.addEventListener("click", this.onActionClick);
    }

    private onDragStart(e: MouseEvent): void {
        document.removeEventListener("mousemove", this.onDragStart);
        document.removeEventListener("click", this.onActionClick);
        this.isDragging = true;
        this.listElement.classList.add(this.listClassHooks.listTranslateSmooth);
        this.placeholderVerticalSpaceValue = this.getElementVerticalSpaceValue(this.draggedElement); this.insertMatchingPlaceholder(this.draggedElement);
        this.detachDraggedElement();
        // Placeholder is taking over the dragged element's index therefore the dragged element is removed from the index calculations.
        this.filteredDomList = ([...this.draggedElement.parentElement.children] as HTMLElement[])
            .filter(child => child !== this.draggedElement);
        this.filteredListMap = Array(this.filteredDomList.length).fill(1).map((_v, i) => i);
        this.placeholderIndex = this.filteredDomList.indexOf(this.placeholderElement);
        document.addEventListener("mousemove", this.onDragMove);
        document.addEventListener("mouseup", this.onDragEnd);
    }

    private getElementVerticalSpaceValue(element: HTMLElement): number {
        const computedStyles: CSSStyleDeclaration = window.getComputedStyle(element);
        return parseFloat(computedStyles.height) + parseFloat(computedStyles.marginBottom) + parseFloat(computedStyles.marginTop);
    }

    private onDragEnter(e: MouseEvent): void {
        if (!this.isDragging) {
            return;
        }
        const draggedOverElement: HTMLElement = e.target as HTMLElement;
        if (draggedOverElement === this.placeholderElement) {
            return;
        }
        const positionChangeData: TPositionChangeData = this.buildPositionChangeData(draggedOverElement);
        // Non placeholder items translations based on the current change.
        positionChangeData.affectedItemIndexes.forEach(i => {
            this.filteredListMap[i] += positionChangeData.affectedItemsPositionIncrementation;
            const positionDiff: number = this.filteredListMap[i] - i;
            const itemElement: HTMLElement = this.filteredDomList[i];
            const yItemTranslationValue: number = positionDiff * this.placeholderVerticalSpaceValue;
            yItemTranslationValue === 0 ?
                this.removeTranslation(itemElement) : this.setTranslation(itemElement, 0, yItemTranslationValue);
        });
        // Placeholder translation based on total translation from the root.
        this.filteredListMap[this.placeholderIndex] = positionChangeData.newPlaceholderPosition;
        const placeholderTranslationY: number = this.getCalculatedPlaceholderTranslationY();
        this.setTranslation(this.placeholderElement, 0, placeholderTranslationY);
    }

    private getCalculatedPlaceholderTranslationY(): number {
        const placeholderPositionDiff: number = this.filteredListMap[this.placeholderIndex] - this.placeholderIndex;
        const placeholderDirectionMultiplier: number = Math.sign(placeholderPositionDiff);
        const allMovedItemIndexes: number[] = new Array(Math.abs(placeholderPositionDiff)).fill(0).map((_val, i) => this.placeholderIndex + placeholderDirectionMultiplier * (i + 1));
        return placeholderDirectionMultiplier * this.getItemsHeight(allMovedItemIndexes);
    }

    private getItemsHeight(itemIndexes: number[]): number {
        const totalHeight: number = itemIndexes.reduce((sum, ind) => {
            const elementHeight: number = this.filteredDomList[ind].offsetHeight + this.ITEM_MARGIN_BOTTOM;
            return sum += elementHeight;
        }, 0);
        return totalHeight;
    }

    private buildPositionChangeData(draggedOverElement: HTMLElement): TPositionChangeData {
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
        // TODO: This algorithm (indexOf) or the whole listMap structure can be improved to avoid indexOf.
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
        const draggedElementClientRect: ClientRect = this.draggedElement.getBoundingClientRect();
        this.draggedElement.style.top = `${draggedElementClientRect.top}px`;
        this.draggedElement.style.left = `${draggedElementClientRect.left}px`;
        this.draggedElement.style.width = `${this.draggedElement.offsetWidth}px`;
        this.draggedElement.style.height = `${this.draggedElement.offsetHeight}px`;
        this.draggedElement.classList.add(this.listClassHooks.itemTranslateInstant);
        this.draggedElement.style.zIndex = "99999";
        this.draggedElement.style.pointerEvents = "none";
        this.draggedElement.style.position = "fixed";
    }

    private attachDraggedElement(): void {
        this.removeTranslation(this.draggedElement);
        this.draggedElement.style.zIndex = "";
        this.draggedElement.style.pointerEvents = "";
        this.draggedElement.style.width = "";
        this.draggedElement.style.height = "";
        this.draggedElement.style.position = "";
        this.draggedElement.style.top = "";
        this.draggedElement.style.left = "";
        this.draggedElement.classList.remove(this.listClassHooks.itemTranslateInstant);
    }

    private onDragMove(e: MouseEvent): void {
        e.preventDefault();
        const xTranslation: number = e.clientX - this.dragStartData.initialCoordinates.x;
        const yTranslation: number = e.clientY - this.dragStartData.initialCoordinates.y;
        this.setTranslation(this.draggedElement, xTranslation, yTranslation);
    }

    private async onDragEnd(e: MouseEvent): Promise<void> {
        document.removeEventListener("mouseup", this.onDragEnd);
        document.removeEventListener("mousemove", this.onDragMove);
        this.isDragging = false;
        const viewStatistics: TListViewStatistics = this.getViewStatistics();
        const viewAdjustedPromise: Promise<void> = this.adjustViewToPlaceholder(viewStatistics);
        const elementPulledPromise: Promise<void> = this.pullElementToPlaceholder(viewStatistics);
        await Promise.all([viewAdjustedPromise, elementPulledPromise]).then(() => this.onDraggedElementPulled());
    }

    private pullElementToPlaceholder(viewStatistics: TListViewStatistics): Promise<void> {
        this.draggedElement.classList.remove(this.listClassHooks.itemTranslateInstant);
        let transitionEndResolveCallback: () => void;
        const elementPulledPromise: Promise<void> = new Promise((res, rej) => {
            transitionEndResolveCallback = res;
        });
        this.draggedElement.addEventListener("transitionend", () => transitionEndResolveCallback());
        elementPulledPromise.then(() => this.draggedElement.removeEventListener("transitionend", this.onDraggedElementPulled));
        if (viewStatistics.hasComponentBeenScrolled) {
            // The calculations of multi levels transitions would be too complicated.
            this.removeTranslation(this.draggedElement);
            this.draggedElement.dispatchEvent(new TransitionEvent("transitionend"));
            return elementPulledPromise;
        }
        let scrollTopDifference: number = this.dragStartData.initialComponentScrollTop - viewStatistics.adjustedScrollTop;
        const placeholderTranslationY: number = this.getCalculatedPlaceholderTranslationY();
        const yTranslationWithScroll: number = placeholderTranslationY + scrollTopDifference;
        const newTranslation: string = `translate(${0}px, ${yTranslationWithScroll}px)`;
        const currentTranslation: string = this.draggedElement.style.transform;
        if (newTranslation === currentTranslation) {
            // That one rare case when someone manages to leave the original element in exactly the same place.
            this.draggedElement.dispatchEvent(new TransitionEvent("transitionend"));
        } else {
            this.setTranslation(this.draggedElement, 0, yTranslationWithScroll);
        }
        return elementPulledPromise;
    }

    private getViewStatistics(): TListViewStatistics {
        const listComponentClientRect: ClientRect = this.listComponentElement.getBoundingClientRect();
        const placeholderClientRect: ClientRect = this.placeholderElement.getBoundingClientRect();
        const isAboveView: boolean = placeholderClientRect.top < listComponentClientRect.top;
        const isBelowView: boolean = placeholderClientRect.top + placeholderClientRect.height > listComponentClientRect.top + listComponentClientRect.height;
        const isPlaceholderInFixedView: boolean = !isAboveView && !isBelowView;
        let newScrollTop: number = this.listComponentElement.scrollTop;
        if (isAboveView) {
            newScrollTop = this.placeholderElement.offsetTop;
        } else if (isBelowView) {
            newScrollTop = this.placeholderElement.offsetTop + this.placeholderVerticalSpaceValue - this.listComponentElement.clientHeight;
        }
        const hasComponentBeenScrolled: boolean = this.dragStartData.initialComponentTop !== listComponentClientRect.top;
        return {
            adjustedScrollTop: newScrollTop,
            isPlaceholderInFixedView: isPlaceholderInFixedView,
            hasComponentBeenScrolled
        }
    }

    private adjustViewToPlaceholder(viewStatistics: TListViewStatistics): Promise<void> {
        let resolveCallback: () => void;
        const viewAdjustedPromise: Promise<void> = new Promise((res, rej) => {
            resolveCallback = res;
        });
        if (!viewStatistics.isPlaceholderInFixedView && !viewStatistics.hasComponentBeenScrolled) {
            const distance: number = viewStatistics.adjustedScrollTop - this.listComponentElement.scrollTop;
            smoothScroll(this.listComponentElement, this.TRANSLATE_TIME, distance, resolveCallback);
        } else {
            resolveCallback();
        }
        return viewAdjustedPromise;
    }

    private onDraggedElementPulled(): void {
        console.warn("TRANSITION END");
        // Remove animation to make the translations removals instant.
        this.listElement.classList.remove(this.listClassHooks.listTranslateSmooth);
        // Remove placeholder
        this.listElement.removeChild(this.placeholderElement);
        // Remove translations
        const fromPosition: number = this.placeholderIndex;
        const toPosition: number = this.filteredListMap[this.placeholderIndex];
        const fromIndex: number = Math.min(fromPosition, toPosition);
        const toIndex: number = Math.max(fromPosition, toPosition);
        for (let i = fromIndex; i <= toIndex; i++) {
            // The reference to the placeholder is still in the array. Therefore it's translations is removed as well for the next drag process. THe original dragged element is never translated.
            this.removeTranslation(this.filteredDomList[i]);
        }
        // Change item position
        this.changeItemPosition(fromPosition, toPosition);
        // Attach draggedElement
        this.attachDraggedElement();
        // Finalize operation
        this.clearProcessDefinitions();
    }

    private cancelExternalDrag(): void {
        document.removeEventListener("mousemove", this.onDragStart);
        document.removeEventListener("mousemove", this.onDragMove);
        document.removeEventListener("mouseup", this.onDragEnd);
        document.removeEventListener("click", this.onActionClick);
        this.toggleElementVisibility(this.externalDraggedElement, true);
        const fromPosition: number = this.placeholderIndex;
        const toPosition: number = this.filteredListMap[this.placeholderIndex];
        // this.removePlaceholderAndTranslations(fromPosition, toPosition);
        this.listElement.removeChild(this.draggedElement);
        this.draggedElement.remove();
        this.draggedElement = this.pureDraggedElement.cloneNode(true) as HTMLElement;
        this.clearProcessDefinitions();
    }

    private clearProcessDefinitions(): void {
        this.filteredDomList = [];
        this.filteredListMap = [];
        this.placeholderIndex = null;
        this.dragMode = DragMode.None;
        this.isDragging = false;
        this.placeholderVerticalSpaceValue = null;
        this.dragStartData = null;
        this.draggedElement = null;
        this.isDraggingFromExternalSource = false;
        this.externalDraggedElement = null;
    }

    private onActionClick(e: MouseEvent): void {
        if (!this.isDragging) {
            document.removeEventListener("mousemove", this.onDragStart);
            const itemIndex: number = Array.from(this.listElement.children).indexOf(this.draggedElement);
            this.clearProcessDefinitions();
            this.onClickNotifier(itemIndex);
        }
    }

    public onClickNotifier(itemIndex: number): void {
        console.warn(`CLICK: ${itemIndex}`);
    }

    public onPositionChangeNotifier(from: number, to: number): void {
        console.warn(`POSITION CHANGE FROM ${from} TO ${to}`);
    }

    public onInsertNotifier(position: number): void {
        console.warn(`INSERT ${position}`);
    }

    private changeItemPosition(fromIndex: number, toIndex: number): void {
        const beforeIndex: number = fromIndex < toIndex ? toIndex + 1 : toIndex;
        const child: Node = this.listElement.children.item(fromIndex);
        const toNode: Node = this.listElement.children.item(beforeIndex);
        this.listElement.insertBefore(child, toNode);
        this.onPositionChangeNotifier(fromIndex, toIndex);
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
        const fakeDownEvent: TWriteable<MouseEvent> = { ...e };
        const fakeMoveEvent: TWriteable<MouseEvent> = { ...e };
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
        // const newItemElement: HTMLElement = this.createItemElement(title);
        // this.pureDraggedElement = newItemElement.cloneNode(true) as HTMLElement;
        // this.draggedElement = newItemElement;
    }

    private externalDragStop(): void {
        if (!this.isDragging) {
            this.clearProcessDefinitions();
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