import { TGridParams } from "../../structures/TGridParams";
import { TGridDimensions } from "../../structures/TGridDimensions";
import { TGridMapData } from "../../structures/TGridMapData";
import { TGridItemPlacement } from "../../structures/TGridItemPlacement";
import { TGridItemDimensions } from "../../structures/TGridItemDimensions";
import { TTranslations } from "../../../../structures/TTranslations";
import { TCoords } from "../../../../structures/TCoords";
import { TGridView } from "../../structures/TGridView";
import { Direction } from "../../../../structures/Direction";

export class GridCalculator {

    private readonly emptyMarker: number = -1;
    private gridElement: HTMLElement;
    private gridParentElement: HTMLElement;
    private columnCount: number;
    private columnGap: number;
    private rowGap: number;
    private minColumnWidth: number | null;

    constructor(gridElement: HTMLElement, gridParentElement: HTMLElement, gridParams: TGridParams) {
        this.gridElement = gridElement;
        this.gridParentElement = gridParentElement;
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

    public findNewPlaceholderPosition(gridView: TGridView, gridCoords: TCoords, gridClientX: number): number {
        let newPlaceholderPosition: number;
        const gridMap: Int16Array[] = gridView.gridMapData.gridMap;
        const currentItemMarker: number = gridMap[gridCoords.y][gridCoords.x];
        if (currentItemMarker === this.emptyMarker) {
            const gridCoordsToTheLeft: TCoords = { x: gridCoords.x - 1, y: gridCoords.y };
            const itemMarkerToTheLeft: number | null = this.findFirstItemMarkerUsingLeftFlow(gridMap, gridCoordsToTheLeft);
            newPlaceholderPosition = itemMarkerToTheLeft === null ? 0 : itemMarkerToTheLeft + 1;
        } else {
            const item: HTMLElement = gridView.itemsList[currentItemMarker];
            if (currentItemMarker === gridView.placeholderIndex) {
                newPlaceholderPosition = currentItemMarker;
            } else {
                const currentItemTranslations: TTranslations = gridView.itemTranslations.get(item);
                const itemCenterX: number = item.offsetLeft + (item.offsetWidth * 0.5) + currentItemTranslations.translateX;
                const itemSide: Direction = gridClientX < itemCenterX ? Direction.Left : Direction.Right;
                if (itemSide === Direction.Left) {
                    newPlaceholderPosition = currentItemMarker;
                } else {
                    newPlaceholderPosition = currentItemMarker + 1;
                }
            }
        }
        return newPlaceholderPosition;
    }

    private findFirstItemMarkerUsingLeftFlow(gridMap: Int16Array[], fromCoords: TCoords): number | null {
        const columnCount: number = gridMap[fromCoords.y].length;
        let itemMarker: number | null = null;
        let currentColumnIndex: number = fromCoords.x;
        scanner:
        for (let rowIndex = fromCoords.y; rowIndex >= 0; rowIndex--) {
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

    public calculateGridCoords(gridClientX: number, gridClientY: number, gridDimensions: TGridDimensions): TCoords {
        let itemX: number = 0;
        let itemY: number = 0;
        let widthSum: number = gridDimensions.columnWidth + 0.5 * gridDimensions.columnGap;
        let heightSum: number = gridDimensions.rowHeight + 0.5 * gridDimensions.rowGap;
        for (let colInd: number = 0; colInd < gridDimensions.columnCount; colInd++) {
            itemX = colInd;
            if (widthSum >= gridClientX) {
                break;
            }
            widthSum += gridDimensions.columnWidth + gridDimensions.columnGap;
        }
        for (let rowInd: number = 0; rowInd < gridDimensions.rowCount; rowInd++) {
            itemY = rowInd;
            if (heightSum >= gridClientY) {
                break;
            }
            heightSum += gridDimensions.rowHeight + gridDimensions.rowGap;
        }
        return {
            x: itemX,
            y: itemY
        }
    }
}