import { Utils } from "../../utils/Utils";
import { TGrid } from "./structures/TGrid";
import GridAttributeHooks from "./structures/GridAttributeHooks";
import { TGridItemProperties } from "./structures/TGridItemProperties";
import { TDragStartData } from "../List/structures/TDragStartData";
import { PointerEventHandler } from "../../utils/pointer-event-handler/PointerEventHandler";
import { PointerEventType } from "../../utils/pointer-event-handler/structures/PointerEventType";
import { TGridItemPlacement } from "./structures/TGridItemPlacement";
import { SyntheticEvent } from "../../utils/pointer-event-handler/structures/SyntheticEvent";
import { Direction } from "../../structures/Direction";
import { TTranslate } from "../../utils/smooth-translate/structures/TTranslate";
import { smoothTranslate } from "../../utils/smooth-translate/smoothTranslate";
import { TGridMapData } from "./structures/TGridMapData";
import { GridUtils } from "./utils/GridUtils";
import { TGridDragState } from "./structures/TGridDragState";
import { TGridView } from "./structures/TGridView";
import { TGridDimensions } from "./structures/TGridDimensions";
import { TTranslations } from "../../structures/TTranslations";
import { TCoords } from "../../structures/TCoords";
import { autoScroll } from "../../utils/auto-scroll/autoScroll";
import { Orientation } from "../../structures/Orientation";

export class Grid {

    private gridElement: HTMLElement;
    private placeholderElement: HTMLElement;
    private scrollableContainer: HTMLElement;
    private pointerEventHandler: PointerEventHandler;

    private readonly emptyMarker: number = -1;
    private gridParams: TGrid;

    private dragState: TGridDragState | null = null;
    private isDragging: boolean = false;

    constructor(container: HTMLElement, params: TGrid) {
        this.gridParams = params;
        this.pointerEventHandler = new PointerEventHandler();
        this.bindMethods();
        this.constructComponent(container, params);
    }

    public dispose(): void {
        this.pointerEventHandler.flushAll();
    }

    private bindMethods(): void {
        this.onActionStart = this.onActionStart.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    private constructComponent(container: HTMLElement, params: TGrid): void {
        const gridTemplate: string = require("./grid.tpl.html");
        const gridElement: HTMLElement = Utils.createElementFromTemplate(gridTemplate);
        gridElement.style.gridTemplateColumns = `repeat(${params.columnCount}, 1fr)`;
        gridElement.style.columnGap = `${params.columnGap}px`;
        gridElement.style.rowGap = `${params.rowGap}px`;
        this.gridElement = gridElement;
        container.append(gridElement);
        this.placeholderElement = this.createPlaceholderElement();
        this.scrollableContainer = container;
    }

    private createPlaceholderElement(): HTMLElement {
        const template: string = require('./templates/placeholder.tpl.html');
        const placeholderElement: HTMLElement = Utils.createElementFromTemplate(template);
        placeholderElement.setAttribute(GridAttributeHooks.item, '');
        return placeholderElement;
    }

    public addItemWithClass(content: HTMLElement) {
        const item: HTMLElement = this.createItem(content);
        this.gridElement.append(item);
        const itemProperties: TGridItemProperties = this.getGridItemProperties(item);
        this.setGridItemAttributes(item, itemProperties.rowspan, itemProperties.colspan);
        if (this.gridParams.allowDynamicClassChange) {
            this.setClassObserver(item);
        }
    }

    private setClassObserver(item: HTMLElement): void {
        const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
            const itemProperties: TGridItemProperties = this.getGridItemProperties(item);
            this.setGridItemAttributes(item, itemProperties.rowspan, itemProperties.colspan);
        });
        observer.observe(item, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    private setGridItemAttributes(item: HTMLElement, rowspan: number, colspan: number): void {
        item.setAttribute(GridAttributeHooks.rowspan, rowspan.toString());
        item.setAttribute(GridAttributeHooks.colspan, colspan.toString());
    }

    private getGridItemProperties(item: HTMLElement): TGridItemProperties {
        const computedProperties: CSSStyleDeclaration = window.getComputedStyle(item);
        const rowspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridRowStart);
        const colspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridColumnStart);
        const rowspan: number = rowspanProperty === null ? 0 : parseInt(rowspanProperty[0].split(' ')[1]);
        const colspan: number = colspanProperty === null ? 0 : Math.min(parseInt(colspanProperty[0].split(' ')[1]), this.gridParams.columnCount);
        return {
            colspan: colspan,
            rowspan: rowspan,
        }
    }

    private createItem(content: HTMLElement): HTMLElement {
        const clonedItem: HTMLElement = content.cloneNode(true) as HTMLElement;
        clonedItem.setAttribute(GridAttributeHooks.item, '');
        const dragAnchor: HTMLElement = Utils.getElementByAttribute(clonedItem, GridAttributeHooks.itemDragAnchor);
        if (!dragAnchor) {
            throw new Error('Provided element has no dragAnchor attribute!');
        }
        this.pointerEventHandler.addEventListener(dragAnchor, PointerEventType.ActionStart, this.onDragStart);
        return clonedItem;
    }

    private createGridMapData(itemsList: HTMLElement[], columnCount: number): TGridMapData {
        return GridUtils.createGridDataView(
            itemsList,
            columnCount,
            this.emptyMarker,
            (item) => parseFloat(item.getAttribute(GridAttributeHooks.rowspan)),
            (item) => parseFloat(item.getAttribute(GridAttributeHooks.colspan)))
    }

    private getDragStartData(event: SyntheticEvent): TDragStartData {
        const gridClientRect: ClientRect = this.scrollableContainer.getBoundingClientRect();
        return {
            initialCoordinates: { x: event.clientX, y: event.clientY },
            initialComponentScrollTop: this.scrollableContainer.scrollTop,
            initialComponentTop: gridClientRect.top,
            initialComponentLeft: gridClientRect.left,
            initialComponentScrollLeft: this.scrollableContainer.scrollLeft
        }
    }

    private createDragState(event: SyntheticEvent, itemsList: HTMLElement[], draggedElement: HTMLElement): TGridDragState {
        const dragStartData: TDragStartData = this.getDragStartData(event);
        const gridMapData: TGridMapData = this.createGridMapData(itemsList, this.gridParams.columnCount);
        const placeholderIndex: number = itemsList.indexOf(this.placeholderElement);
        const gridDimensions: TGridDimensions = GridUtils.calculateGridDimensions(this.gridElement, gridMapData.gridMap, this.gridParams.columnCount, this.gridParams.rowGap, this.gridParams.columnGap, null);
        const itemTranslations: WeakMap<HTMLElement, TTranslations> = new WeakMap();
        itemsList.forEach(item => itemTranslations.set(item, { translateX: 0, translateY: 0 }));
        const gridView: TGridView = { gridDimensions, itemsList, gridMapData, itemTranslations };
        return {
            dragStartData,
            draggedElement,
            placeholderIndex,
            originalDragItemsList: itemsList,
            gridView: gridView,
            containerScrollCallbacks: null,
            isTranslating: false,
        }
    }

    private onActionStart(event: SyntheticEvent): void {
        if (this.dragState) {
            return;
        };
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, this.onDragStart);
    }

    private onDragStart(event: SyntheticEvent): void {
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionMove, this.onDragStart);
        const clickedElement: HTMLElement = event.currentTarget as HTMLElement;
        const draggedElement: HTMLElement = this.getClosestGridItem(clickedElement);
        const originalDragItemsList: HTMLElement[] = [...this.gridElement.children] as HTMLElement[];
        this.setPlaceholderStyles(draggedElement);
        const draggedElementIndex: number = originalDragItemsList.indexOf(draggedElement);
        originalDragItemsList.splice(draggedElementIndex, 1, this.placeholderElement);
        this.dragState = this.createDragState(event, originalDragItemsList, draggedElement);
        this.setDraggedElementStyles(draggedElement);
        this.dragState.draggedElement.after(this.placeholderElement);
        this.detachElement(this.dragState.draggedElement);
        this.isDragging = true;
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, this.onDragMove);
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionEnd, this.onDragEnd);



        const scrollableContainerRect: ClientRect = this.scrollableContainer.getBoundingClientRect();
        const scX0: number = scrollableContainerRect.left;
        const scX1: number = scrollableContainerRect.left + scrollableContainerRect.width;
        const scY0: number = scrollableContainerRect.top;
        const scY1: number = scrollableContainerRect.top + scrollableContainerRect.height;
        const horizontalScrollTriggerWidthPerSide: number = scrollableContainerRect.width * 0.10;
        const verticalScrollTriggerWidthPerSide: number = scrollableContainerRect.height * 0.10;

        // scroll a nie client?event
        // this.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, (e => {
        //     const gridX: number = e.clientX - scX0;
        //     const gridY: number = e.clientY - scY0;
        //     const incrementReducer: number = 0.1;
        //     let horizontalIncrement: number | null = null;
        //     if (this.isBetween(gridX, 0, horizontalScrollTriggerWidthPerSide)) {
        //         horizontalIncrement = -(horizontalScrollTriggerWidthPerSide - gridX) * incrementReducer;
        //     } else if (this.isBetween(gridX, this.scrollableContainer.clientWidth - horizontalScrollTriggerWidthPerSide, this.scrollableContainer.clientWidth)) {
        //         horizontalIncrement = (horizontalScrollTriggerWidthPerSide - (this.scrollableContainer.clientWidth - gridX)) * incrementReducer;
        //     }

        //     let verticalIncrement: number | null = null;
        //     if (this.isBetween(gridY, 0, verticalScrollTriggerWidthPerSide)) {
        //         verticalIncrement = -(verticalScrollTriggerWidthPerSide - gridY) * incrementReducer;
        //     } else if (this.isBetween(gridY, this.scrollableContainer.clientHeight - verticalScrollTriggerWidthPerSide, this.scrollableContainer.clientHeight)) {
        //         verticalIncrement = (verticalScrollTriggerWidthPerSide - (this.scrollableContainer.clientHeight - gridY)) * incrementReducer;
        //     }

        //     const shouldScroll: boolean = horizontalIncrement !== null || verticalIncrement !== null;

        //     if (shouldScroll) {
        //         if (this.dragState.containerScrollCallbacks) {
        //             this.dragState.containerScrollCallbacks.setIncrement(Orientation.Horizontal, horizontalIncrement || 0);
        //             this.dragState.containerScrollCallbacks.setIncrement(Orientation.Vertical, verticalIncrement || 0);
        //         } else {
        //             this.dragState.containerScrollCallbacks = autoScroll(this.scrollableContainer, horizontalIncrement, verticalIncrement);
        //         }
        //     } else if (this.dragState.containerScrollCallbacks) {
        //         this.dragState.containerScrollCallbacks.cancel();
        //         this.dragState.containerScrollCallbacks = null;
        //     }
        // }));
    }

    private isBetween(value: number, min: number, max: number, inclusive?: boolean): boolean {
        return value > min && value < max;
    }

    private onDragMove(event: SyntheticEvent): void {
        const xTranslation: number = event.clientX - this.dragState.dragStartData.initialCoordinates.x;
        const yTranslation: number = event.clientY - this.dragState.dragStartData.initialCoordinates.y;
        this.setTranslation(this.dragState.draggedElement, xTranslation, yTranslation);
        if (this.dragState.isTranslating) {
            return;
        }
        const gridClientX: number = this.scrollableContainer.scrollLeft + event.clientX - this.dragState.dragStartData.initialComponentLeft;
        const gridClientY: number = this.scrollableContainer.scrollTop + event.clientY - this.dragState.dragStartData.initialComponentTop;
        const gridCoords: TCoords = GridUtils.getGridCoordsFromPointer(gridClientX, gridClientY, this.dragState.gridView.gridDimensions);
        const previousGridMap: Int16Array[] = this.dragState.gridView.gridMapData.gridMap;





        const currentPlaceholderIndex: number = this.findNewPlaceholderIndex(previousGridMap, this.dragState.placeholderIndex, this.dragState.gridView.itemTranslations, gridCoords, gridClientX);
        if (this.dragState.placeholderIndex !== currentPlaceholderIndex) {

            const currentItemList: HTMLElement[] = this.getNewItemList(this.dragState.gridView.itemsList, this.dragState.placeholderIndex, currentPlaceholderIndex);
            const currentGridMapData: TGridMapData = this.createGridMapData(currentItemList, this.gridParams.columnCount);
            const currentGridDimensions: TGridDimensions = GridUtils.calculateGridDimensions(this.gridElement, currentGridMapData.gridMap, this.gridParams.columnCount, this.gridParams.rowGap, this.gridParams.columnGap, this.dragState.gridView.gridDimensions);
            const currentItemTranslations = this.createAnimations(this.dragState.gridView, currentItemList, currentGridMapData, currentGridDimensions);
            this.dragState.gridView = {
                itemsList: currentItemList,
                gridDimensions: currentGridDimensions,
                gridMapData: currentGridMapData,
                itemTranslations: currentItemTranslations
            }
            this.dragState.placeholderIndex = currentPlaceholderIndex;
        }

        const scrollableContainerRect: ClientRect = this.scrollableContainer.getBoundingClientRect();
        const scX0: number = scrollableContainerRect.left;
        const scX1: number = scrollableContainerRect.left + scrollableContainerRect.width;
        const scY0: number = scrollableContainerRect.top;
        const scY1: number = scrollableContainerRect.top + scrollableContainerRect.height;
        const horizontalScrollTriggerWidthPerSide: number = scrollableContainerRect.width * 0.10;
        const verticalScrollTriggerWidthPerSide: number = scrollableContainerRect.height * 0.10;

        const gridX: number = event.clientX - scX0;
        const gridY: number = event.clientY - scY0;
        const incrementReducer: number = 0.1;
        let horizontalIncrement: number | null = null;
        if (this.isBetween(gridX, 0, horizontalScrollTriggerWidthPerSide)) {
            horizontalIncrement = -(horizontalScrollTriggerWidthPerSide - gridX) * incrementReducer;
        } else if (this.isBetween(gridX, this.scrollableContainer.clientWidth - horizontalScrollTriggerWidthPerSide, this.scrollableContainer.clientWidth)) {
            horizontalIncrement = (horizontalScrollTriggerWidthPerSide - (this.scrollableContainer.clientWidth - gridX)) * incrementReducer;
        }

        let verticalIncrement: number | null = null;
        if (this.isBetween(gridY, 0, verticalScrollTriggerWidthPerSide)) {
            verticalIncrement = -(verticalScrollTriggerWidthPerSide - gridY) * incrementReducer;
        } else if (this.isBetween(gridY, this.scrollableContainer.clientHeight - verticalScrollTriggerWidthPerSide, this.scrollableContainer.clientHeight)) {
            verticalIncrement = (verticalScrollTriggerWidthPerSide - (this.scrollableContainer.clientHeight - gridY)) * incrementReducer;
        }

        const shouldScroll: boolean = horizontalIncrement !== null || verticalIncrement !== null;

        if (shouldScroll) {
            if (this.dragState.containerScrollCallbacks) {
                this.dragState.containerScrollCallbacks.setIncrement(Orientation.Horizontal, horizontalIncrement || 0);
                this.dragState.containerScrollCallbacks.setIncrement(Orientation.Vertical, verticalIncrement || 0);
            } else {
                this.dragState.containerScrollCallbacks = autoScroll(this.scrollableContainer, horizontalIncrement, verticalIncrement, () => this.onDragMove({ ...event }));
            }
        } else if (this.dragState.containerScrollCallbacks) {
            this.dragState.containerScrollCallbacks.cancel();
            this.dragState.containerScrollCallbacks = null;
        }
    }

    private createAnimations(previousGridView: TGridView, currentItemsList: HTMLElement[], currentGridMapData: TGridMapData, currentGridDimensions: TGridDimensions): WeakMap<HTMLElement, TTranslations> {
        let translations: TTranslate[] = [];
        const currentItemTranslations: WeakMap<HTMLElement, TTranslations> = new WeakMap();
        currentItemsList.forEach((item) => {
            const previousPlacement: TGridItemPlacement = previousGridView.gridMapData.itemPlacements.get(item);
            const currentPlacement: TGridItemPlacement = currentGridMapData.itemPlacements.get(item);
            const hasPlacementChanged: boolean = previousPlacement.x !== currentPlacement.x || previousPlacement.y !== currentPlacement.y;
            if (hasPlacementChanged) {
                const previousTranslations: TTranslations = previousGridView.itemTranslations.get(item);
                const xDirectTranslateValue: number = Utils.createRange(Math.min(previousPlacement.x, currentPlacement.x), Math.max(previousPlacement.x, currentPlacement.x)).reduce((sum, curr) => sum += currentGridDimensions.columnWidths[curr] + currentGridDimensions.columnGap, 0) * Math.sign(currentPlacement.x - previousPlacement.x);
                const yDirectTranslateValue: number = Utils.createRange(Math.min(previousPlacement.y, currentPlacement.y), Math.max(previousPlacement.y, currentPlacement.y)).reduce((sum, curr) => sum += currentGridDimensions.rowHeights[curr] + currentGridDimensions.rowGap, 0) * Math.sign(currentPlacement.y - previousPlacement.y);
                const adjustedXTranslateValue: number = previousTranslations.translateX + xDirectTranslateValue;
                const adjustedYTranslateValue: number = previousTranslations.translateY + yDirectTranslateValue;
                currentItemTranslations.set(item, { translateX: adjustedXTranslateValue, translateY: adjustedYTranslateValue });
                translations.push({
                    fromX: previousTranslations.translateX,
                    fromY: previousTranslations.translateY,
                    element: item,
                    toX: adjustedXTranslateValue,
                    toY: adjustedYTranslateValue,
                })
            } else {
                const previousTranslations: TTranslations = previousGridView.itemTranslations.get(item);
                currentItemTranslations.set(item, { translateX: previousTranslations.translateX, translateY: previousTranslations.translateY });
            }
        });
        this.dragState.isTranslating = true;
        smoothTranslate(translations, 200, () => {
            this.dragState.isTranslating = false;
            console.warn("DONE");
        });
        return currentItemTranslations;
    }

    private getNewItemList(itemList: HTMLElement[], previousPlaceholderIndex: number, newPlaceholderIndex: number): HTMLElement[] {
        const newItemList: HTMLElement[] = [...itemList];
        Utils.moveItemInArray(newItemList, previousPlaceholderIndex, newPlaceholderIndex);
        return newItemList;
    }

    private findNewPlaceholderIndex(gridMap: Int16Array[], previousPlaceholderIndex: number, previousItemTranslations: WeakMap<HTMLElement, TTranslations>, gridCoordinates: TCoords, gridClientX: number): number {
        let placeholderIndex: number;
        const itemMarker: number = gridMap[gridCoordinates.y][gridCoordinates.x];
        if (itemMarker === this.emptyMarker) {
            const markerToTheLeft: number | null = GridUtils.findFirstNonEmptyValueFromFlowLeft(gridMap, gridCoordinates, this.emptyMarker);
            placeholderIndex = markerToTheLeft === null ? 0 : markerToTheLeft;
        } else {
            const item: HTMLElement = this.dragState.gridView.itemsList[itemMarker];
            if (item === this.placeholderElement) {
                placeholderIndex = this.dragState.placeholderIndex;
            } else {
                const itemTranslations: TTranslations = previousItemTranslations.get(item);
                const itemCenterX: number = item.offsetLeft + (item.offsetWidth * 0.5) + itemTranslations.translateX;
                const itemSide: Direction = gridClientX < itemCenterX ? Direction.Left : Direction.Right;
                if (itemSide === Direction.Left) {
                    placeholderIndex = previousPlaceholderIndex > itemMarker ? itemMarker : Math.max(0, itemMarker - 1);
                } else {
                    placeholderIndex = previousPlaceholderIndex > itemMarker ? itemMarker + 1 : itemMarker;
                }
            }
        }
        return placeholderIndex;
    }

    private onDragEnd(event: SyntheticEvent): void {
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionMove, this.onDragMove);
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionEnd, this.onDragEnd);
        this.isDragging = false;
        this.removeTranslation(this.dragState.draggedElement);
    }

    private setTranslation(element: HTMLElement, x: number, y: number): void {
        element.style.transform = `translate(${x}px, ${y}px)`;
    }

    private removeTranslation(element: HTMLElement): void {
        element.style.transform = '';
    }

    private setPlaceholderStyles(mirrorGridItem: HTMLElement): void {
        const itemProperties: TGridItemProperties = this.getGridItemProperties(mirrorGridItem);
        this.setGridItemAttributes(this.placeholderElement, itemProperties.rowspan, itemProperties.colspan);
        this.placeholderElement.style.width = `${mirrorGridItem.offsetWidth}px`;
        this.placeholderElement.style.height = `${mirrorGridItem.offsetHeight}px`;
        this.placeholderElement.style.gridRowStart = `span ${itemProperties.rowspan}`;
        this.placeholderElement.style.gridColumnStart = `span ${itemProperties.colspan}`;
    }

    private setDraggedElementStyles(mirrorGridItem: HTMLElement): void {
        const mirrorElementClientRect: ClientRect = mirrorGridItem.getBoundingClientRect();
        this.dragState.draggedElement.style.top = `${mirrorElementClientRect.top}px`;
        this.dragState.draggedElement.style.left = `${mirrorElementClientRect.left}px`;
        this.dragState.draggedElement.style.width = `${this.dragState.draggedElement.offsetWidth}px`;
        this.dragState.draggedElement.style.height = `${this.dragState.draggedElement.offsetHeight}px`;
        this.dragState.draggedElement.style.zIndex = "1";
        this.dragState.draggedElement.style.pointerEvents = "none";
    }

    private detachElement(element: HTMLElement): void {

        element.style.position = "fixed";
    }

    private getClosestGridItem(fromElement: HTMLElement): HTMLElement | null {
        return fromElement.closest(`[${GridAttributeHooks.item}]`) as HTMLElement;
    }

}