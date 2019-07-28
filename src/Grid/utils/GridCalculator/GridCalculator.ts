import { TGridParams } from '../../structures/TGridParams';
import { TGridDimensions } from '../../structures/TGridDimensions';
import { TGridMapData } from '../../structures/TGridMapData';
import { TGridItemPlacement } from '../../structures/TGridItemPlacement';
import { TGridItemDimensions } from '../../structures/TGridItemDimensions';
import { TTranslations } from '../../../common/structures/TTranslations';
import { TCoords } from '../../../common/structures/TCoords';
import { TGridView } from '../../structures/TGridView';
import { Side } from '../../structures/Side';
import { TDragViewportParams } from '../../../List/structures/TDragViewportParams';
import { TGridItemTrigger } from '../../structures/TGridItemTrigger';
import { TClientRect } from '../../../common/structures/TClientRect';

export class GridCalculator {

    private readonly emptyMarker: number = -1;
    private gridElement: HTMLElement;
    private gridParentElement: HTMLElement;
    private gridScrollableElement: HTMLElement;
    private columnCount: number;
    private columnGap: number;
    private rowGap: number;
    private minColumnWidth: number | null;

    constructor(gridElement: HTMLElement, gridParentElement: HTMLElement, gridScrollableElement: HTMLElement, gridParams: TGridParams) {
        this.gridElement = gridElement;
        this.gridParentElement = gridParentElement;
        this.gridScrollableElement = gridScrollableElement;
        this.columnCount = gridParams.columnCount;
        this.rowGap = gridParams.rowGap;
        this.columnGap = gridParams.columnGap;
        this.minColumnWidth = gridParams.minColumnWidth || null;
    }

    public getColumnCount(): number {
        return this.columnCount;
    }

    public getRowGap(): number {
        return this.rowGap;
    }

    public getColumnGap(): number {
        return this.columnGap;
    }

    public calculateColumnWidth(): number {
        const parentStyles: CSSStyleDeclaration = window.getComputedStyle(this.gridParentElement);
        const gridContentWidth: number = this.gridParentElement.clientWidth - parseFloat(parentStyles.paddingLeft) - parseFloat(parentStyles.paddingRight);
        const calculatedColumnWidth: number = (gridContentWidth - ((this.columnCount - 1) * this.columnGap)) / this.columnCount;
        return Math.max(calculatedColumnWidth, this.minColumnWidth || 0);
    }

    public calculateGridDimensions(gridMap: Int16Array[], previousGridDimensions?: TGridDimensions | null): TGridDimensions {
        const rowCount: number = gridMap.length;
        if (previousGridDimensions && previousGridDimensions.rowCount === rowCount) {
            return { ...previousGridDimensions };
        }
        const computedProperties: CSSStyleDeclaration = window.getComputedStyle(this.gridElement);
        const extractedRowHeight: number = parseFloat(computedProperties.gridTemplateRows.split(' ')[0]);
        const rowHeight: number = isNaN(extractedRowHeight) ? 0 : extractedRowHeight;

        let columnWidth: number;
        if (previousGridDimensions) {
            columnWidth = previousGridDimensions.columnWidth;
        } else {
            const extractedColumnWidth: number = parseFloat(computedProperties.gridTemplateColumns.split(' ')[0]);
            columnWidth = isNaN(extractedColumnWidth) ? 0 : extractedColumnWidth;
        }
        return {
            columnCount: this.columnCount,
            columnGap: this.columnGap,
            columnWidth,
            rowCount,
            rowGap: this.rowGap,
            rowHeight
        };
    }

    public createGridMapData(itemsList: HTMLElement[], gridItemDimensions: WeakMap<HTMLElement, TGridItemDimensions>): TGridMapData {
        const gridMap: Int16Array[] = [];
        const itemPlacements: WeakMap<HTMLElement, TGridItemPlacement> = new WeakMap();
        let firstAllowedRowIndFromFlow: number = 0;
        let firstAllowedColIndFromFlow: number = 0;
        itemsList.forEach((item, itemMarker) => {
            const itemDimensions: TGridItemDimensions = gridItemDimensions.get(item);
            const { rowspan, colspan } = itemDimensions;
            let currentRowInd: number = firstAllowedRowIndFromFlow;
            let currentColInd: number = firstAllowedColIndFromFlow;

            for (let tryNumber = 0; tryNumber < 100000; tryNumber++) {
                if (!gridMap[currentRowInd]) {
                    gridMap[currentRowInd] = this.createEmptyGridRow();
                }
                const currentRow: Int16Array = gridMap[currentRowInd];
                const insertColIndex: number | null = this.getFirstEmptyColumnIndex(currentRow, currentColInd, colspan);
                if (insertColIndex === null) {
                    currentRowInd += 1;
                    currentColInd = 0;
                    continue;
                }
                currentColInd = insertColIndex;
                this.assertMapShape(gridMap, currentRowInd, currentRowInd + rowspan);
                this.setItemInMap(gridMap, itemMarker, currentColInd, currentRowInd, rowspan, colspan);
                itemPlacements.set(item, {
                    colspan,
                    rowspan,
                    x: currentColInd,
                    y: currentRowInd
                })

                firstAllowedRowIndFromFlow = currentRowInd;
                firstAllowedColIndFromFlow = currentColInd + colspan;
                if (firstAllowedColIndFromFlow > this.columnCount - 1) {
                    firstAllowedRowIndFromFlow = currentRowInd + 1;
                    firstAllowedColIndFromFlow = 0;
                }
                break;
            }
        });
        return { gridMap, itemPlacements };
    }

    private createEmptyGridRow(): Int16Array {
        return new Int16Array(this.columnCount).fill(this.emptyMarker);
    }

    private getFirstEmptyColumnIndex(row: Int16Array, startIndex: number, columnspan: number): number | null {
        let emptyColumnIndex: number = null;
        const maxAllowedColumnIndex: number = Math.min(row.length - columnspan, row.length - 1);
        for (let colInd: number = startIndex; colInd <= maxAllowedColumnIndex; colInd++) {
            const slice: Int16Array = row.slice(colInd, colInd + columnspan);
            if (slice.every(ind => ind === this.emptyMarker)) {
                emptyColumnIndex = colInd;
                break;
            }
        }
        return emptyColumnIndex;
    }

    private assertMapShape(map: Int16Array[], fromRowInd: number, toRowInd: number): void {
        for (let rowInd = fromRowInd; rowInd < toRowInd; rowInd++) {
            if (!map[rowInd]) {
                map[rowInd] = this.createEmptyGridRow();
            }
        }
    }

    private setItemInMap(map: Int16Array[], marker: number, x: number, y: number, rowspan: number, colspan: number): void {
        for (let rowInd = y; rowInd < y + rowspan; rowInd++) {
            const dataRow: number[] = new Array(colspan).fill(marker);
            map[rowInd].set(dataRow, x);
        }
    }

    public findNewPlaceholderIndex(gridView: TGridView, gridPositionCoords: TCoords, gridClientX: number, forbiddenTrigger: TGridItemTrigger): number {
        let newPlaceholderIndex: number;
        const currentItemMarker: number = gridView.gridMapData.gridMap[gridPositionCoords.y][gridPositionCoords.x];
        if (currentItemMarker === this.emptyMarker) {
            newPlaceholderIndex = this.findNewPlaceholderIndexFromLeftFlow(gridView, gridPositionCoords, gridClientX, forbiddenTrigger);
        } else {
            newPlaceholderIndex = this.findNewPlaceholderIndexFromHoveredOverElement(gridView, gridPositionCoords, gridClientX, forbiddenTrigger)
        }
        return newPlaceholderIndex;
    }

    private findNewPlaceholderIndexFromHoveredOverElement(gridView: TGridView, gridPositionCoords: TCoords, gridClientX: number, forbiddenTrigger: TGridItemTrigger): number {
        let newPlaceholderIndex: number;
        const currentItemMarker: number = gridView.gridMapData.gridMap[gridPositionCoords.y][gridPositionCoords.x];
        if (currentItemMarker === gridView.placeholderIndex) {
            newPlaceholderIndex = gridView.placeholderIndex;
        } else {
            const item: HTMLElement = gridView.itemsList[currentItemMarker];
            const currentItemTranslations: TTranslations = gridView.itemTranslations.get(item);
            const itemCenterX: number = item.offsetLeft + (item.offsetWidth * 0.5) + currentItemTranslations.translateX;
            const itemSide: Side = gridClientX < itemCenterX ? Side.Left : Side.Right;
            if (item === forbiddenTrigger.item && itemSide === forbiddenTrigger.side) {
                newPlaceholderIndex = gridView.placeholderIndex;
            } else if (itemSide === Side.Left) {
                newPlaceholderIndex = gridView.placeholderIndex < currentItemMarker ? Math.max(0, currentItemMarker - 1) : currentItemMarker;
            } else {
                newPlaceholderIndex = gridView.placeholderIndex < currentItemMarker ? currentItemMarker : currentItemMarker + 1;
            }
        }
        return newPlaceholderIndex;
    }

    private findNewPlaceholderIndexFromLeftFlow(gridView: TGridView, gridPositionCoords: TCoords, gridClientX: number, forbiddenTrigger: TGridItemTrigger): number {
        let newPlaceholderIndex: number;
        const gridCoordsToTheLeft: TCoords = { x: gridPositionCoords.x - 1, y: gridPositionCoords.y };
        const itemMarkerToTheLeft: number | null = this.findFirstItemMarkerUsingLeftFlow(gridView.gridMapData.gridMap, gridCoordsToTheLeft);
        const itemToTheLeft: HTMLElement = itemMarkerToTheLeft === null ? null : gridView.itemsList[itemMarkerToTheLeft];
        if (itemMarkerToTheLeft === null) {
            newPlaceholderIndex = 0;
        } else {
            if (itemToTheLeft === forbiddenTrigger.item) {
                newPlaceholderIndex = gridView.placeholderIndex;
            } else {
                newPlaceholderIndex = gridView.placeholderIndex < itemMarkerToTheLeft ? itemMarkerToTheLeft : itemMarkerToTheLeft + 1;
            }
        }
        return newPlaceholderIndex;
    }

    private findFirstItemMarkerUsingLeftFlow(gridMap: Int16Array[], fromPositionCoords: TCoords): number | null {
        const columnCount: number = gridMap[fromPositionCoords.y].length;
        let itemMarker: number | null = null;
        let currentColumnIndex: number = fromPositionCoords.x;
        scanner:
        for (let rowIndex = fromPositionCoords.y; rowIndex >= 0; rowIndex--) {
            for (let columnIndex = currentColumnIndex; columnIndex >= 0; columnIndex--) {
                const currentValue: number = gridMap[rowIndex][columnIndex];
                if (currentValue !== this.emptyMarker) {
                    itemMarker = currentValue;
                    break scanner;
                }
            }
            currentColumnIndex = columnCount - 1;
        }
        return itemMarker;
    }

    public calculateGridPositionCoords(gridClientX: number, gridClientY: number, gridDimensions: TGridDimensions): TCoords {
        let gridX: number = 0;
        let gridY: number = 0;
        let widthSum: number = gridDimensions.columnWidth + 0.5 * gridDimensions.columnGap;
        let heightSum: number = gridDimensions.rowHeight + 0.5 * gridDimensions.rowGap;
        for (let colInd: number = 0; colInd < gridDimensions.columnCount; colInd++) {
            gridX = colInd;
            if (widthSum >= gridClientX) {
                break;
            }
            widthSum += gridDimensions.columnWidth + gridDimensions.columnGap;
        }
        for (let rowInd: number = 0; rowInd < gridDimensions.rowCount; rowInd++) {
            gridY = rowInd;
            if (heightSum >= gridClientY) {
                break;
            }
            heightSum += gridDimensions.rowHeight + gridDimensions.rowGap;
        }
        return { x: gridX, y: gridY }
    }

    public calculateInitialDragViewportParams(clientX: number, clientY: number): TDragViewportParams {
        const scrollableContainerClientRect: ClientRect = this.gridScrollableElement.getBoundingClientRect();
        const gridElementClientRect: ClientRect = this.gridElement.getBoundingClientRect();
        const windowWidth: number = window.innerWidth || document.body.clientWidth;
        const windowHeight: number = window.innerHeight || document.body.clientHeight;
        const scrollableContainerVisibleWidth: number = windowWidth - scrollableContainerClientRect.left;
        const scrollableContainerVisibleHeight: number = windowHeight - scrollableContainerClientRect.top;
        const visibleScrollableLeft: number = Math.max(0, scrollableContainerClientRect.left);
        const visibleScrollableTop: number = Math.max(0, scrollableContainerClientRect.top);
        const visibleScrollableClientRect: TClientRect = {
            top: visibleScrollableTop,
            bottom: Math.min(windowHeight, visibleScrollableTop + this.gridScrollableElement.clientHeight),
            left: visibleScrollableLeft,
            right: Math.min(windowWidth, visibleScrollableLeft + this.gridScrollableElement.clientWidth),
        }
        return {
            initialCoordinates: { x: clientX, y: clientY },
            initialScrollableScrollTop: this.gridScrollableElement.scrollTop,
            initialScrollableTop: scrollableContainerClientRect.top,
            initialScrollableLeft: scrollableContainerClientRect.left,
            initialScrollableScrollLeft: this.gridScrollableElement.scrollLeft,
            initialGridLeft: gridElementClientRect.left,
            initialGridTop: gridElementClientRect.top,
            horizontalScrollTriggerWidth: scrollableContainerVisibleWidth * 0.1,
            verticalScrollTriggerHeight: scrollableContainerVisibleHeight * 0.1,
            visibleScrollableClientRect,
        }
    }

    public calculateVisibleGridElementClientRect(): TClientRect {
        const gridElementClientRect: ClientRect = this.gridElement.getBoundingClientRect();
        const windowWidth: number = window.innerWidth || document.body.clientWidth;
        const windowHeight: number = window.innerHeight || document.body.clientHeight;
        const visibleGridLeft: number = Math.max(0, gridElementClientRect.left);
        const visibleGridTop: number = Math.max(0, gridElementClientRect.top);
        return {
            top: visibleGridTop,
            bottom: Math.min(windowHeight, visibleGridTop + this.gridElement.clientHeight),
            left: visibleGridLeft,
            right: Math.min(windowWidth, visibleGridLeft + this.gridElement.clientWidth),
        }
    }

    public getGridClientCoords(clientX: number, clientY: number, initialScrollableLeft: number, initialScrollableTop: number): TCoords {
        const gridClientX: number = this.gridScrollableElement.scrollLeft + clientX - initialScrollableLeft;
        const gridClientY: number = this.gridScrollableElement.scrollTop + clientY - initialScrollableTop;
        return { x: gridClientX, y: gridClientY };
    }

    public calculateForbiddenTrigger(gridMap: Int16Array[], gridClientX: number, gridPositionCoords: TCoords, itemsList: HTMLElement[], translations: WeakMap<HTMLElement, TTranslations>): TGridItemTrigger {
        const itemMarker: number = gridMap[gridPositionCoords.y][gridPositionCoords.x];
        let item: HTMLElement;
        let side: Side;
        if (itemMarker !== -1) {
            item = itemsList[itemMarker];
            const itemCenterX: number = item.offsetLeft + item.offsetWidth * 0.5 + translations.get(item).translateX;
            side = gridClientX < itemCenterX ? Side.Left : Side.Right;
        } else {
            const leftMarker: number | null = this.findFirstItemMarkerUsingLeftFlow(gridMap, gridPositionCoords);
            item = leftMarker === null ? itemsList[0] : itemsList[leftMarker];
            side = leftMarker === null ? Side.Left : Side.Right;
        }
        return { item, side };
    }

    public isBetweenColumns(value: number, min: number, max: number): boolean {
        return value >= min && value < max;
    }
}