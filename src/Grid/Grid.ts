import ResizeService from '../common/services/resizeService/ResizeService';
import { TCoords } from '../common/structures/TCoords';
import { TTranslations } from '../common/structures/TTranslations';
import { autoScroll } from '../common/utils/auto-scroll/autoScroll';
import { PointerEventHandler } from '../common/utils/pointer-event-handler/PointerEventHandler';
import { PointerEventType } from '../common/utils/pointer-event-handler/structures/PointerEventType';
import { SyntheticEvent } from '../common/utils/pointer-event-handler/structures/SyntheticEvent';
import { smoothTranslate } from '../common/utils/smooth-translate/smoothTranslate';
import { TTranslate } from '../common/utils/smooth-translate/structures/TTranslate';
import { Utils } from '../common/utils/Utils';
import { TDragViewportParams } from '../List/structures/TDragViewportParams';
import { IGridHandlers } from './interfaces/IGridHandlers';
import GridAttributeHooks from './structures/GridAttributeHooks';
import { Side } from './structures/Side';
import { TGridDimensions } from './structures/TGridDimensions';
import { TGridDragState } from './structures/TGridDragState';
import { TGridItemDimensions } from './structures/TGridItemDimensions';
import { TGridItemPlacement } from './structures/TGridItemPlacement';
import { TGridItemProperties } from './structures/TGridItemProperties';
import { TGridItemTrigger } from './structures/TGridItemTrigger';
import { TGridMapData } from './structures/TGridMapData';
import { TGridParams } from './structures/TGridParams';
import { TGridView } from './structures/TGridView';
import { GridCalculator } from './utils/GridCalculator/GridCalculator';
import { GridExternalDragHandler } from './utils/GridExternalDragHandler/GridExternalDragHandler';
import { GridUtils } from './utils/GridUtils/GridUtils';

export class Grid {

    private gridElement: HTMLElement;
    private gridScrollableElement: HTMLElement;
    private placeholderElement: HTMLElement;
    private gridCalculator: GridCalculator;
    private pointerEventHandler: PointerEventHandler;
    private readonly translationTime: number = 200;

    private allowDynamicClassChange: boolean;
    private gridItemObservers: WeakMap<HTMLElement, MutationObserver>;
    private gridItemDimensions: WeakMap<HTMLElement, TGridItemDimensions>;
    private dragState: TGridDragState | null = null;
    private externalDragHandler: GridExternalDragHandler;

    constructor(container: HTMLElement, scrollableContainer: HTMLElement, params: TGridParams) {
        this.gridScrollableElement = scrollableContainer;
        this.allowDynamicClassChange = params.allowDynamicClassChange || false;
        this.pointerEventHandler = new PointerEventHandler();
        this.gridItemObservers = new WeakMap();
        this.gridItemDimensions = new WeakMap();
        this.bindMethods();
        this.constructComponent(container, scrollableContainer, params);
    }

    public dispose(): void {
        ResizeService.unsubscribe(this.gridScrollableElement);
        this.clear();
    }

    public clear(): void {
        this.pointerEventHandler.flushAll();
        if (this.allowDynamicClassChange) {
            this.getItemsList()
                .forEach((child: HTMLElement) => this.gridItemObservers.get(child).disconnect());
        }
        this.gridElement.innerHTML = '';
    }

    private bindMethods(): void {
        this.onActionStart = this.onActionStart.bind(this);
        this.onActionClickTap = this.onActionClickTap.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragMove = this.onDragMove.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    private setGridTemplateColumns(): void {
        const columnWidth: number = this.gridCalculator.calculateColumnWidth();
        this.gridElement.style.gridTemplateColumns = `repeat(${this.gridCalculator.getColumnCount()}, ${columnWidth}px)`;
    }

    private setGridGaps(): void {
        this.gridElement.style.rowGap = `${this.gridCalculator.getRowGap()}px`;
        this.gridElement.style.columnGap = `${this.gridCalculator.getColumnGap()}px`;
    }

    private constructComponent(container: HTMLElement, scrollableContainer: HTMLElement, params: TGridParams): void {
        const gridTemplate: string = require('./grid.tpl.html');
        this.gridElement = Utils.createElementFromTemplate(gridTemplate);
        this.gridCalculator = new GridCalculator(this.gridElement, container, scrollableContainer, params);
        this.externalDragHandler = this.createExternalGridHandler();
        this.setGridTemplateColumns();
        this.setGridGaps();
        container.append(this.gridElement);
        this.placeholderElement = this.createPlaceholderElement();
        if (params.watchAnyResize) {
            ResizeService.subscribeToAny(this.gridScrollableElement, () => this.setGridTemplateColumns());
        } else {
            ResizeService.subscribeToWindow(container, () => this.setGridTemplateColumns());
        }
    }

    private createExternalGridHandler(): GridExternalDragHandler {
        return new GridExternalDragHandler({
            gridCalculator: this.gridCalculator,
            addItemWithClass: this.addItemWithClass.bind(this),
            gridElement: this.gridElement,
            pointerEventHandler: this.pointerEventHandler,
            getGridItemDimensions: () => this.gridItemDimensions,
            getItemsList: this.getItemsList.bind(this),
            onDragStart: this.onDragStart.bind(this),
            onDragTerminate: this.onDragTerminate.bind(this),
            removeItem: this.removeItem.bind(this)
        })
    }

    private createPlaceholderElement(): HTMLElement {
        const template: string = require('./templates/placeholder.tpl.html');
        const placeholderElement: HTMLElement = Utils.createElementFromTemplate(template);
        placeholderElement.setAttribute(GridAttributeHooks.item, '');
        return placeholderElement;
    }

    public addItemWithClass(content: HTMLElement, position?: number): void {
        const item: HTMLElement = this.createItem(content);
        if (position >= 0) {
            this.gridElement.insertBefore(item, this.gridElement.children[position]);
        } else {
            this.gridElement.append(item);
        }
        const itemProperties: TGridItemProperties = GridUtils.getGridItemPropertiesFromStyles(content, this.gridCalculator.getColumnCount());
        this.gridItemDimensions.set(item, { colspan: itemProperties.colspan, rowspan: itemProperties.rowspan });
        this.setGridItemStyles(item, itemProperties.rowspan, itemProperties.colspan);
        if (this.allowDynamicClassChange) {
            this.setClassObserver(item);
        }
    }

    public removeItem(position: number): void {
        const item: HTMLElement = this.gridElement.children[position] as HTMLElement;
        if (this.allowDynamicClassChange) {
            this.gridItemObservers.get(item).disconnect();
            this.gridItemObservers.delete(item);
        }
        this.gridItemDimensions.delete(item);
        this.gridElement.removeChild(item);

    }

    private setClassObserver(item: HTMLElement): void {
        const classChangeElement: HTMLElement = item.firstElementChild as HTMLElement;
        const observer: MutationObserver = new MutationObserver((_mutations: MutationRecord[]) => {
            const itemProperties: TGridItemProperties = GridUtils.getGridItemPropertiesFromStyles(classChangeElement as HTMLElement, this.gridCalculator.getColumnCount());
            this.gridItemDimensions.set(item, { colspan: itemProperties.colspan, rowspan: itemProperties.rowspan });
            this.setGridItemStyles(item, itemProperties.rowspan, itemProperties.colspan);
        });
        this.gridItemObservers.set(item, observer);
        observer.observe(classChangeElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    private setGridItemStyles(item: HTMLElement, rowspan: number, colspan: number): void {
        item.style.gridRowStart = `span ${rowspan}`;
        item.style.gridColumnStart = `span ${colspan}`;
    }

    private createItem(content: HTMLElement): HTMLElement {
        const wrapper: HTMLElement = document.createElement('div');
        wrapper.setAttribute(GridAttributeHooks.item, '');
        wrapper.append(content);
        const dragAnchor: HTMLElement = Utils.getElementByAttribute(content, GridAttributeHooks.itemDragAnchor);
        if (!dragAnchor) {
            throw new Error('Provided element has no dragAnchor attribute!');
        }
        this.pointerEventHandler.addEventListener(dragAnchor, PointerEventType.ActionStart, this.onActionStart);
        return wrapper;
    }

    private createInitialDragState(event: SyntheticEvent, itemsList: HTMLElement[], draggedElement: HTMLElement): TGridDragState {
        const initialDragViewportParams: TDragViewportParams = this.gridCalculator.calculateInitialDragViewportParams(event.clientX, event.clientY);
        const gridMapData: TGridMapData = this.gridCalculator.createGridMapData(itemsList, this.gridItemDimensions);
        const placeholderIndex: number = itemsList.indexOf(this.placeholderElement);
        const gridDimensions: TGridDimensions = this.gridCalculator.calculateGridDimensions(gridMapData.gridMap, null);
        const itemTranslations: WeakMap<HTMLElement, TTranslations> = new WeakMap();
        itemsList.forEach(item => itemTranslations.set(item, { translateX: 0, translateY: 0 }));
        const forbiddenTrigger: TGridItemTrigger = { item: this.placeholderElement, side: Side.Left };
        const gridView: TGridView = { gridDimensions, itemsList, placeholderIndex, gridMapData, itemTranslations, forbiddenTrigger };
        const draggedElementTranslations: TTranslations = { translateX: 0, translateY: 0 };
        return {
            dragViewportParams: initialDragViewportParams,
            draggedElement,
            originalDraggedElementIndex: placeholderIndex,
            originalDragItemsList: itemsList,
            gridView: gridView,
            containerScrollCallbacks: null,
            itemsTranslationUnsubscribeCallback: null,
            isTranslating: false,
            draggedElementTranslations
        }
    }

    private onActionStart(_event: SyntheticEvent): void {
        if (this.dragState) {
            return;
        };
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionClickTap, this.onActionClickTap);
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, this.onDragStart);
    }

    private onActionClickTap(_event: SyntheticEvent): void {
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionClickTap, this.onActionClickTap);
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionMove, this.onDragStart);
    }

    private onDragStart(event: SyntheticEvent): void {
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionMove, this.onDragStart);
        const clickedElement: HTMLElement = event.target as HTMLElement;
        const draggedElement: HTMLElement = this.getClosestGridItem(clickedElement);
        this.setPlaceholderStyles(draggedElement);
        const dragItemsList: HTMLElement[] = [...this.gridElement.children] as HTMLElement[];
        const draggedElementIndex: number = dragItemsList.indexOf(draggedElement);
        dragItemsList.splice(draggedElementIndex, 1, this.placeholderElement);
        this.dragState = this.createInitialDragState(event, dragItemsList, draggedElement);
        this.setDraggedElementStyles(draggedElement);
        this.detachDraggedElement(this.dragState.draggedElement);
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, this.onDragMove);
        this.pointerEventHandler.addEventListener(document, PointerEventType.ActionEnd, this.onDragEnd);
        this.onDragMove(event);
    }

    private onDragMove(event: SyntheticEvent): void {
        const xTranslation: number = event.clientX - this.dragState.dragViewportParams.initialCoordinates.x;
        const yTranslation: number = event.clientY - this.dragState.dragViewportParams.initialCoordinates.y;
        this.dragState.draggedElementTranslations.translateX = xTranslation;
        this.dragState.draggedElementTranslations.translateY = yTranslation;
        this.setTranslation(this.dragState.draggedElement, xTranslation, yTranslation);
        if (!this.dragState.isTranslating) {
            const gridClientCoords: TCoords = this.gridCalculator.getGridClientCoords(event.clientX, event.clientY, this.dragState.dragViewportParams.initialScrollableLeft, this.dragState.dragViewportParams.initialScrollableTop);
            this.updateDragView(gridClientCoords);
        }
        this.updateAutoScroll(event);
    }

    private updateDragView(gridClientCoords: TCoords): void {
        const gridPositionCoords: TCoords = this.gridCalculator.calculateGridPositionCoords(gridClientCoords.x, gridClientCoords.y, this.dragState.gridView.gridDimensions);
        const previousPlaceholderIndex: number = this.dragState.gridView.placeholderIndex;
        const newPlaceholderIndex: number = this.gridCalculator.findNewPlaceholderIndex(this.dragState.gridView, gridPositionCoords, gridClientCoords.x, this.dragState.gridView.forbiddenTrigger);
        if (previousPlaceholderIndex !== newPlaceholderIndex) {
            const newItemList: HTMLElement[] = GridUtils.getReorderedItemList(this.dragState.gridView.itemsList, previousPlaceholderIndex, newPlaceholderIndex);
            const newGridMapData: TGridMapData = this.gridCalculator.createGridMapData(newItemList, this.gridItemDimensions);
            const newGridDimensions: TGridDimensions = this.gridCalculator.calculateGridDimensions(newGridMapData.gridMap, this.dragState.gridView.gridDimensions);
            const newItemTranslations: WeakMap<HTMLElement, TTranslations> = this.createItemAnimations(this.dragState.gridView, newItemList, newGridMapData, newGridDimensions);
            const newForbiddenTrigger: TGridItemTrigger = this.gridCalculator.calculateForbiddenTrigger(newGridMapData.gridMap, gridClientCoords.x, gridPositionCoords, newItemList, newItemTranslations);
            this.dragState.gridView = {
                itemsList: newItemList,
                gridDimensions: newGridDimensions,
                placeholderIndex: newPlaceholderIndex,
                gridMapData: newGridMapData,
                itemTranslations: newItemTranslations,
                forbiddenTrigger: newForbiddenTrigger
            }
        }
    }

    private updateAutoScroll(event: SyntheticEvent): void {
        const { visibleScrollableClientRect: visibleScrollableClientRect, horizontalScrollTriggerWidth, verticalScrollTriggerHeight } = this.dragState.dragViewportParams;

        const scrollStepReducer: number = 0.1;
        let horizontalIncrement: number | null = null;
        if (GridUtils.isBetween(event.clientX, visibleScrollableClientRect.left, visibleScrollableClientRect.left + horizontalScrollTriggerWidth)) {
            horizontalIncrement = -(horizontalScrollTriggerWidth - (event.clientX - visibleScrollableClientRect.left)) * scrollStepReducer;
        } else if (GridUtils.isBetween(event.clientX, visibleScrollableClientRect.right - horizontalScrollTriggerWidth, visibleScrollableClientRect.right)) {
            horizontalIncrement = (horizontalScrollTriggerWidth - (visibleScrollableClientRect.right - event.clientX)) * scrollStepReducer;
        }

        let verticalIncrement: number | null = null;
        if (GridUtils.isBetween(event.clientY, visibleScrollableClientRect.top, visibleScrollableClientRect.top + verticalScrollTriggerHeight)) {
            verticalIncrement = -(verticalScrollTriggerHeight - (event.clientY - visibleScrollableClientRect.top)) * scrollStepReducer;
        } else if (GridUtils.isBetween(event.clientY, visibleScrollableClientRect.bottom - verticalScrollTriggerHeight, visibleScrollableClientRect.bottom)) {
            verticalIncrement = (verticalScrollTriggerHeight - (visibleScrollableClientRect.bottom - event.clientY)) * scrollStepReducer;
        }

        const shouldScroll: boolean = horizontalIncrement !== null || verticalIncrement !== null;
        if (shouldScroll) {
            if (this.dragState.containerScrollCallbacks) {
                this.dragState.containerScrollCallbacks.setIncrement(horizontalIncrement || 0, verticalIncrement || 0);
            } else {
                this.dragState.containerScrollCallbacks = autoScroll(this.gridScrollableElement, horizontalIncrement, verticalIncrement, () => this.onDragMove({ ...event }));
            }
        } else if (this.dragState.containerScrollCallbacks) {
            this.dragState.containerScrollCallbacks.cancel();
            this.dragState.containerScrollCallbacks = null;
        }
    }

    private createItemAnimations(previousGridView: TGridView, currentItemsList: HTMLElement[], currentGridMapData: TGridMapData, currentGridDimensions: TGridDimensions): WeakMap<HTMLElement, TTranslations> {
        let translations: TTranslate[] = [];
        const currentItemTranslations: WeakMap<HTMLElement, TTranslations> = new WeakMap();
        currentItemsList.forEach((item) => {
            const previousPlacement: TGridItemPlacement = previousGridView.gridMapData.itemPlacements.get(item);
            const currentPlacement: TGridItemPlacement = currentGridMapData.itemPlacements.get(item);
            const hasPlacementChanged: boolean = previousPlacement.x !== currentPlacement.x || previousPlacement.y !== currentPlacement.y;
            if (hasPlacementChanged) {
                const previousTranslations: TTranslations = previousGridView.itemTranslations.get(item);
                const xDirectTranslateValue: number = Utils.createRange(Math.min(previousPlacement.x, currentPlacement.x), Math.max(previousPlacement.x, currentPlacement.x)).reduce((sum, curr) => sum += currentGridDimensions.columnWidth + currentGridDimensions.columnGap, 0) * Math.sign(currentPlacement.x - previousPlacement.x);
                const yDirectTranslateValue: number = Utils.createRange(Math.min(previousPlacement.y, currentPlacement.y), Math.max(previousPlacement.y, currentPlacement.y)).reduce((sum, curr) => sum += currentGridDimensions.rowHeight + currentGridDimensions.rowGap, 0) * Math.sign(currentPlacement.y - previousPlacement.y);
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
                currentItemTranslations.set(item, previousTranslations);
            }
        });
        this.dragState.isTranslating = true;
        smoothTranslate(translations, this.translationTime, () => {
            this.dragState.isTranslating = false;
        });
        return currentItemTranslations;
    }

    private onDragTerminate(): void {
        if (!this.dragState) {
            return;
        }
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionMove, this.onDragMove);
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionEnd, this.onDragEnd);
        if (this.dragState.containerScrollCallbacks) {
            this.dragState.containerScrollCallbacks.cancel();
        }
        if (this.dragState.itemsTranslationUnsubscribeCallback) {
            this.dragState.itemsTranslationUnsubscribeCallback();
        }
        Array.from(this.gridElement.children).forEach((item: Element) => this.removeTranslation(item as HTMLElement));
        this.gridElement.removeChild(this.placeholderElement);
        this.removePlaceholderStyles();
        this.dragState = null;
    }

    private onDragEnd(_event: SyntheticEvent): void {
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionMove, this.onDragMove);
        this.pointerEventHandler.removeEventListener(document, PointerEventType.ActionEnd, this.onDragEnd);
        this.dragState.containerScrollCallbacks && this.dragState.containerScrollCallbacks.cancel();
        const placeholderTranslation: TTranslations = this.dragState.gridView.itemTranslations.get(this.placeholderElement);
        smoothTranslate([{
            element: this.dragState.draggedElement,
            fromX: this.dragState.draggedElementTranslations.translateX,
            fromY: this.dragState.draggedElementTranslations.translateY,
            toX: placeholderTranslation.translateX + (this.dragState.dragViewportParams.initialScrollableScrollLeft - this.gridScrollableElement.scrollLeft),
            toY: placeholderTranslation.translateY + (this.dragState.dragViewportParams.initialScrollableScrollTop - this.gridScrollableElement.scrollTop)
        }], this.translationTime, () => this.onDragEndStatic());
    }

    private onDragEndStatic(): void {
        this.gridElement.removeChild(this.placeholderElement);
        this.removePlaceholderStyles();
        const fromIndex: number = this.dragState.originalDragItemsList.indexOf(this.placeholderElement);
        const toIndex: number = this.dragState.gridView.placeholderIndex;
        [...this.gridElement.children].forEach(item => this.removeTranslation(item as HTMLElement));
        const newRightIndex: number = fromIndex < toIndex ? toIndex + 1 : toIndex;
        const movedItem: HTMLElement = this.gridElement.children.item(fromIndex) as HTMLElement;
        const rightNode: HTMLElement = this.gridElement.children.item(newRightIndex) as HTMLElement;
        this.attachDraggedElement(movedItem, rightNode);
        this.externalDragHandler.onExternalDragEndSuccess();
        this.dragState = null;
    }

    private setTranslation(element: HTMLElement, x: number, y: number): void {
        element.style.transform = `translate(${x}px, ${y}px)`;
    }

    private removeTranslation(element: HTMLElement): void {
        element.style.transform = '';
    }

    private setPlaceholderStyles(mirrorGridItem: HTMLElement): void {
        const itemProperties: TGridItemProperties = GridUtils.getGridItemPropertiesFromStyles(mirrorGridItem, this.gridCalculator.getColumnCount());
        this.gridItemDimensions.set(this.placeholderElement, { colspan: itemProperties.colspan, rowspan: itemProperties.rowspan });
        this.placeholderElement.style.width = `${mirrorGridItem.offsetWidth}px`;
        this.placeholderElement.style.height = `${mirrorGridItem.offsetHeight}px`;
        this.placeholderElement.style.gridRowStart = `span ${itemProperties.rowspan}`;
        this.placeholderElement.style.gridColumnStart = `span ${itemProperties.colspan}`;
    }

    private removePlaceholderStyles(): void {
        this.gridItemDimensions.delete(this.placeholderElement);
        this.placeholderElement.style.width = ``;
        this.placeholderElement.style.height = ``;
        this.placeholderElement.style.gridRowStart = ``;
        this.placeholderElement.style.gridColumnStart = ``;
        this.removeTranslation(this.placeholderElement);
    }

    private setDraggedElementStyles(mirrorGridItem: HTMLElement): void {
        const mirrorItemClientRect: ClientRect = mirrorGridItem.getBoundingClientRect();
        this.dragState.draggedElement.style.top = `${mirrorItemClientRect.top}px`;
        this.dragState.draggedElement.style.left = `${mirrorItemClientRect.left}px`;
        this.dragState.draggedElement.style.width = `${this.dragState.draggedElement.offsetWidth}px`;
        this.dragState.draggedElement.style.height = `${this.dragState.draggedElement.offsetHeight}px`;
        this.dragState.draggedElement.style.zIndex = '1';
        this.dragState.draggedElement.style.pointerEvents = 'none';
    }

    private removeDraggedElementStyles(): void {
        this.dragState.draggedElement.style.top = ``;
        this.dragState.draggedElement.style.left = ``;
        this.dragState.draggedElement.style.width = ``;
        this.dragState.draggedElement.style.height = ``;
        this.dragState.draggedElement.style.zIndex = ``;
        this.dragState.draggedElement.style.pointerEvents = ``;
    }

    private detachDraggedElement(draggedElement: HTMLElement): void {
        draggedElement.after(this.placeholderElement);
        draggedElement.style.position = 'fixed';
        draggedElement.style.opacity = '0.5';
    }

    private getItemsList(): HTMLElement[] {
        return Array.from(this.gridElement.children) as HTMLElement[];
    }

    private attachDraggedElement(draggedElement: HTMLElement, rightNode: HTMLElement): void {
        this.gridElement.insertBefore(draggedElement, rightNode);
        this.removeDraggedElementStyles();
        this.dragState.draggedElement.style.position = '';
        draggedElement.style.opacity = '';
    }

    private getClosestGridItem(fromElement: HTMLElement): HTMLElement | null {
        return fromElement.closest(`[${GridAttributeHooks.item}]`) as HTMLElement;
    }

    public getGridHandlers(): IGridHandlers {
        return this.externalDragHandler.getGridHandlers();
    }
}