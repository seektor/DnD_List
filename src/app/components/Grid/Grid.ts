import { Utils } from "../../utils/Utils";
import { TGrid } from "./structures/TGrid";
import GridAttributeHooks from "./structures/GridAttributeHooks";
import { TGridItemProperties } from "./structures/TGridItemProperties";
import { TDragStartData } from "../List/structures/TDragStartData";
import { PointerEventHandler } from "../../utils/pointer-event-handler/PointerEventHandler";
import { PointerEventType } from "../../utils/pointer-event-handler/structures/PointerEventType";
import { TGridItemPlacement } from "./structures/TGridItemPlacement";
import { SyntheticEvent } from "../../utils/pointer-event-handler/structures/SyntheticEvent";
import { Direction } from "./structures/Direction";
import { TTranslate } from "../../utils/smooth-translate/structures/TTranslate";
import { smoothTranslate } from "../../utils/smooth-translate/smoothTranslate";
import { TGridMapData } from "./structures/TGridMapData";
import { GridUtils } from "./utils/GridUtils";
import { TGridDragState } from "./structures/TGridDragState";
import { TGridView } from "./structures/TGridView";
import { TGridDimensions } from "./structures/TGridDimensions";
import { TTranslations } from "../../structures/TTranslations";
import { TGridItemSwapDirection } from "./structures/TGridItemSwapDirectiton";
import { TCoords } from "../../structures/TCoords";

export class Grid {

    private gridElement: HTMLElement;
    private placeholderElement: HTMLElement;
    private pointerEventHandler: PointerEventHandler;

    private readonly emptyMarker: number = -1;
    private columnCount: number;
    private columnGap: number;
    private rowGap: number;
    private allowDynamicClassChange: boolean;

    private dragState: TGridDragState | null = null;
    private isDragging: boolean = false;

    constructor(container: HTMLElement, params: TGrid) {
        this.pointerEventHandler = new PointerEventHandler();
        this.processParams(params);
        this.bindMethods();
        this.constructComponent(container, params);
    }

    private processParams(params: TGrid) {
        this.columnCount = params.columnCount;
        this.columnGap = params.columnGap;
        this.rowGap = params.rowGap;
        this.allowDynamicClassChange = params.allowDynamicClassChange;
    }

    private bindMethods(): void {
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    private constructComponent(container: HTMLElement, params: TGrid) {
        const gridTemplate: string = require("./grid.tpl.html");
        const gridElement: HTMLElement = Utils.createElementFromTemplate(gridTemplate);
        gridElement.style.gridTemplateColumns = `repeat(${params.columnCount}, minmax(0, 1fr))`;
        gridElement.style.columnGap = `${params.columnGap}px`;
        gridElement.style.rowGap = `${params.rowGap}px`;
        this.gridElement = gridElement;
        container.append(gridElement);
        this.placeholderElement = this.createPlaceholderElement();
    }

    private createPlaceholderElement(): HTMLElement {
        const template: string = require('./templates/placeholder.tpl.html');
        const placeholderElement: HTMLElement = Utils.createElementFromTemplate(template);
        placeholderElement.setAttribute(GridAttributeHooks.item, '');
        return placeholderElement;
    }

    public addItemByStyle(content: HTMLElement, rowspan: number, colspan: number) {
        const item: HTMLElement = this.createItem(content);
        this.setItemDisplayAttributes(item, rowspan, colspan);
        this.gridElement.append(item);
    }

    public addItemWithClass(content: HTMLElement) {
        const item: HTMLElement = this.createItem(content);
        this.gridElement.append(item);
        const itemProperties: TGridItemProperties = this.getGridItemProperties(item);
        this.setItemDisplayAttributes(item, itemProperties.rowspan, itemProperties.colspan);
        if (this.allowDynamicClassChange) {
            this.setClassObserver(item);
        }
    }

    private setClassObserver(item: HTMLElement): void {
        const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
            const itemProperties: TGridItemProperties = this.getGridItemProperties(item);
            this.setItemDisplayAttributes(item, itemProperties.rowspan, itemProperties.colspan);
        });
        observer.observe(item, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    private setItemDisplayAttributes(item: HTMLElement, rowspan: number, colspan: number): void {
        item.setAttribute(GridAttributeHooks.rowspan, rowspan.toString());
        item.setAttribute(GridAttributeHooks.colspan, colspan.toString());
    }

    private getGridItemProperties(item: HTMLElement): TGridItemProperties {
        const computedProperties: CSSStyleDeclaration = window.getComputedStyle(item);
        const rowspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridRowStart);
        const colspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridColumnStart);
        const rowspan: number = rowspanProperty === null ? 0 : parseInt(rowspanProperty[0].split(' ')[1]);
        const colspan: number = colspanProperty === null ? 0 : Math.min(parseInt(colspanProperty[0].split(' ')[1]), this.columnCount);
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
        const gridClientRect: ClientRect = this.gridElement.getBoundingClientRect();
        return {
            initialCoordinates: { x: event.clientX, y: event.clientY },
            initialComponentScrollTop: this.gridElement.scrollTop,
            initialComponentTop: gridClientRect.top,
            initialComponentLeft: gridClientRect.left,
            initialComponentScrollLeft: this.gridElement.scrollLeft
        }
    }

    private createDragState(event: SyntheticEvent, itemsList: HTMLElement[], draggedElement: HTMLElement): TGridDragState {
        const dragStartData: TDragStartData = this.getDragStartData(event);
        const gridMapData: TGridMapData = this.createGridMapData(itemsList, this.columnCount);
        const placeholderIndex: number = itemsList.indexOf(this.placeholderElement);
        const gridDimensions: TGridDimensions = GridUtils.calculateGridDimensions(this.gridElement, gridMapData.gridMap, this.columnCount, this.rowGap, this.columnGap, null);
        const itemTranslations: WeakMap<HTMLElement, TTranslations> = new WeakMap();
        itemsList.forEach(item => itemTranslations.set(item, { translateX: 0, translateY: 0 }));
        const gridView: TGridView = { gridDimensions, itemsList, gridMapData, itemTranslations };
        return {
            dragStartData,
            draggedElement,
            placeholderIndex,
            originalDragItemsList: itemsList,
            gridView: gridView,
            isTranslating: false,
        }
    }

    private onDragStart(event: SyntheticEvent) {
        const clickedElement: HTMLElement = event.currentTarget as HTMLElement;
        const draggedElement: HTMLElement = this.getClosestGridItem(clickedElement);
        const originalDragItemsList: HTMLElement[] = [...this.gridElement.children] as HTMLElement[];
        const draggedElementIndex: number = originalDragItemsList.indexOf(draggedElement);
        this.updatePlaceholderStyles(draggedElement);
        originalDragItemsList.splice(draggedElementIndex, 1, this.placeholderElement);
        this.dragState = this.createDragState(event, originalDragItemsList, draggedElement);

        const draggedElementClientRect: ClientRect = this.dragState.draggedElement.getBoundingClientRect();
        this.dragState.draggedElement.style.top = `${draggedElementClientRect.top}px`;
        this.dragState.draggedElement.style.left = `${draggedElementClientRect.left}px`;
        this.dragState.draggedElement.style.width = `${this.dragState.draggedElement.offsetWidth}px`;
        this.dragState.draggedElement.style.height = `${this.dragState.draggedElement.offsetHeight}px`;
        this.dragState.draggedElement.style.zIndex = "1";
        this.dragState.draggedElement.style.pointerEvents = "none";

        this.dragState.draggedElement.after(this.placeholderElement);
        this.detachElement(this.dragState.draggedElement);
        this.isDragging = true;
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, this.onDragMove);
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionEnd, this.onDragEnd);
    }

    private onDragMove(event: SyntheticEvent): void {
        const xTranslation: number = event.clientX - this.dragState.dragStartData.initialCoordinates.x;
        const yTranslation: number = event.clientY - this.dragState.dragStartData.initialCoordinates.y;
        this.setTranslation(this.dragState.draggedElement, xTranslation, yTranslation);
        if (this.dragState.isTranslating) {
            return;
        }
        const gridClientX: number = event.clientX - this.dragState.dragStartData.initialComponentLeft;
        const gridClientY: number = event.clientY - this.dragState.dragStartData.initialComponentTop;
        const gridCoords: TCoords = GridUtils.getGridCoordsFromPointer(gridClientX, gridClientY, this.dragState.gridView.gridDimensions);
        const previousGridMap: Int8Array[] = this.dragState.gridView.gridMapData.gridMap;

        // console.log(previousGridMap[gridCoords.y][gridCoords.x]);




        const currentPlaceholderIndex: number = this.findNewPlaceholderIndex(previousGridMap, this.dragState.placeholderIndex, this.dragState.gridView.itemTranslations, gridCoords, gridClientX);
        if (this.dragState.placeholderIndex === currentPlaceholderIndex) {
            return;
        }
        const currentItemList: HTMLElement[] = this.getNewItemList(this.dragState.gridView.itemsList, this.dragState.placeholderIndex, currentPlaceholderIndex);
        const currentGridMapData: TGridMapData = this.createGridMapData(currentItemList, this.columnCount);
        const currentGridDimensions: TGridDimensions = GridUtils.calculateGridDimensions(this.gridElement, currentGridMapData.gridMap, this.columnCount, this.rowGap, this.columnGap, this.dragState.gridView.gridDimensions);
        const currentItemTranslations = this.createAnimations(this.dragState.gridView, currentItemList, currentGridMapData, currentGridDimensions);
        this.dragState.gridView = {
            itemsList: currentItemList,
            gridDimensions: currentGridDimensions,
            gridMapData: currentGridMapData,
            itemTranslations: currentItemTranslations
        }
        this.dragState.placeholderIndex = currentPlaceholderIndex;
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
                console.log(previousTranslations.translateX, adjustedXTranslateValue, currentPlacement.x, previousGridView.gridMapData.itemPlacements.get(item), currentGridMapData, Utils.createRange(Math.min(previousPlacement.x, currentPlacement.x), Math.max(previousPlacement.x, currentPlacement.x)));
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

    private findNewPlaceholderIndex(gridMap: Int8Array[], previousPlaceholderIndex: number, previousItemTranslations: WeakMap<HTMLElement, TTranslations>, gridCoordinates: TCoords, gridClientX: number): number {
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

    private updatePlaceholderStyles(mirrorItem: HTMLElement): void {
        const itemProperties: TGridItemProperties = this.getGridItemProperties(mirrorItem);
        this.setItemDisplayAttributes(this.placeholderElement, itemProperties.rowspan, itemProperties.colspan);
        this.placeholderElement.style.width = `${mirrorItem.offsetWidth}px`;
        this.placeholderElement.style.height = `${mirrorItem.offsetHeight}px`;
        this.placeholderElement.style.gridRowStart = `span ${itemProperties.rowspan}`;
        this.placeholderElement.style.gridColumnStart = `span ${itemProperties.colspan}`;
    }

    private detachElement(element: HTMLElement): void {

        element.style.position = "fixed";
    }

    private getClosestGridItem(fromElement: HTMLElement): HTMLElement | null {
        return fromElement.closest(`[${GridAttributeHooks.item}]`) as HTMLElement;
    }

}