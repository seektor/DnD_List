import { TCoords } from '../../../common/structures/TCoords';
import { TDomRect } from '../../../common/structures/TDomRect';
import { PointerEventType } from '../../../common/utils/pointer-event-handler/structures/PointerEventType';
import { SyntheticEvent } from '../../../common/utils/pointer-event-handler/structures/SyntheticEvent';
import { Utils } from '../../../common/utils/Utils';
import { IGridHandlers } from '../../interfaces/IGridHandlers';
import GridAttributeHooks from '../../structures/GridAttributeHooks';
import GridClassHooks from '../../structures/GridClassHooks';
import { TGridDimensions } from '../../structures/TGridDimensions';
import { TGridMapData } from '../../structures/TGridMapData';
import { GridUtils } from '../GridUtils/GridUtils';
import { IExternalDragHandlerParams } from './interfaces/IExternalDragHandlerParams';
import { TExternalDragState } from './structures/TExternalDragState';

export class GridExternalDragHandler {

    private host: IExternalDragHandlerParams;
    private externalDragState: TExternalDragState | null = null;

    constructor(params: IExternalDragHandlerParams) {
        this.host = params;
        this.bindMethods();
    }

    private bindMethods(): void {
        this.onExternalDragCross = this.onExternalDragCross.bind(this);
    }

    private toggleDropzone(isEnabled: boolean): void {
        if (isEnabled) {
            this.host.gridElement.classList.add(GridClassHooks.highlighted);
        } else {
            this.host.gridElement.classList.remove(GridClassHooks.highlighted);
        }
    }

    private onExternalDragStart(externalDraggedElement: HTMLElement, itemContentElement: HTMLElement, onInsertCallback: (index: number) => void): void {
        this.toggleExternalAccessListener(true);
        const windowRect: TDomRect = this.host.gridCalculator.calculateWindowRect();
        this.externalDragState = {
            gridVisiblePageRect: this.host.gridCalculator.calculateGridVisiblePageRect(windowRect),
            externalDraggedElement,
            itemContent: itemContentElement,
            isOver: false,
            insertIndex: null,
            onInsertCallback
        };
    }

    private toggleExternalAccessListener(isEnabled: boolean): void {
        if (isEnabled) {
            this.host.pointerEventHandler.addEventListener(document, PointerEventType.ActionMove, this.onExternalDragCross);
        } else {
            this.host.pointerEventHandler.removeEventListener(document, PointerEventType.ActionMove, this.onExternalDragCross);
        }
    }

    private onExternalDragCross(event: SyntheticEvent): void {
        const isOver: boolean = this.isInGridRange(event.pageX, event.pageY, this.externalDragState.gridVisiblePageRect);
        const prevIsOverState: boolean = this.externalDragState.isOver;
        if (prevIsOverState !== isOver) {
            if (isOver) {
                this.onExternalDragEnter(event);
            } else {
                this.onExternalDragLeave(event);
            }
            this.externalDragState.isOver = isOver;
        }
    }

    private onExternalDragEnter(event: SyntheticEvent): void {
        this.toggleElementVisibility(this.externalDragState.externalDraggedElement, false);
        const insertIndex: number = this.getClosestInsertIndex(event);
        this.externalDragState.insertIndex = insertIndex;
        this.host.addItemWithClass(this.externalDragState.itemContent, insertIndex);
        const clickedItem: HTMLElement = this.host.getItemsList()[insertIndex];
        const dragAnchor: HTMLElement = Utils.getElementByAttribute(clickedItem, GridAttributeHooks.itemDragAnchor);
        const dragAnchorClientRect: ClientRect = dragAnchor.getBoundingClientRect();
        const itemAnchorXTranslate: number = dragAnchorClientRect.left + dragAnchor.clientWidth * 0.5;
        const itemAnchorYTranslate: number = dragAnchorClientRect.top + dragAnchor.clientHeight * 0.5;
        const dragStartEvent: SyntheticEvent = {
            ...event,
            clientX: itemAnchorXTranslate,
            clientY: itemAnchorYTranslate,
            target: clickedItem
        }
        this.host.onDragStart(dragStartEvent);
    }

    private onExternalDragLeave(event: SyntheticEvent): void {
        this.host.removeItem(this.externalDragState.insertIndex);
        this.toggleElementVisibility(this.externalDragState.externalDraggedElement, true);
        this.host.onDragTerminate();
        this.externalDragState.insertIndex = null;
    }

    public onExternalDragEndSuccess(): void {
        if (this.externalDragState) {
            this.externalDragState.onInsertCallback(this.externalDragState.insertIndex);
        }
    }

    private onExternalDragEnd(): void {
        this.toggleExternalAccessListener(false);
        this.externalDragState = null;
    }

    private getClosestInsertIndex(event: SyntheticEvent): number {
        const windowRect: TDomRect = this.host.gridCalculator.calculateWindowRect();
        const pageRect: TDomRect = this.host.gridCalculator.calculateGridVisiblePageRect(windowRect);
        const gridClientCoords: TCoords = this.host.gridCalculator.getGridClientCoords(event.pageX, event.pageY, pageRect.left, pageRect.top);
        const itemsList: HTMLElement[] = this.host.getItemsList();
        const gridMapData: TGridMapData = this.host.gridCalculator.createGridMapData(itemsList, this.host.getGridItemDimensions());
        const gridDimensions: TGridDimensions = this.host.gridCalculator.calculateGridDimensions(gridMapData.gridMap, null);
        const gridPositionCoords: TCoords = this.host.gridCalculator.calculateGridPositionCoords(gridClientCoords.x, gridClientCoords.y, gridDimensions);
        return this.host.gridCalculator.findIndexToInsert(gridMapData.gridMap, itemsList, gridClientCoords.x, gridPositionCoords);
    }

    private toggleElementVisibility(element: HTMLElement, isVisible: boolean): void {
        const newVisibility: string = isVisible ? '' : 'hidden';
        element.style.visibility = newVisibility;
    }

    private isInGridRange(pageX: number, pageY: number, gridVisiblePageRect: TDomRect): boolean {
        const { left, top, width, height } = gridVisiblePageRect;
        return GridUtils.isBetween(pageX, left, left + width) && GridUtils.isBetween(pageY, top, top + height);
    }

    public getGridHandlers(): IGridHandlers {
        return {
            toggleDropzone: this.toggleDropzone.bind(this),
            onExternalDragStart: this.onExternalDragStart.bind(this),
            onExternalDragEnd: this.onExternalDragEnd.bind(this),
        };
    }
}