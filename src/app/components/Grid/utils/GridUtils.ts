import { TGridMapData } from "../structures/TGridMapData";
import { TGridDimensions } from "../structures/TGridDimensions";
import { TCoords } from "../../../structures/TCoords";
import { TGridItemPlacement } from "../structures/TGridItemPlacement";

export class GridUtils {

    public static createGridDataView(itemsList: HTMLElement[], columnCount: number, emptyMarker: number, rowspanExtractor: (item: HTMLElement) => number, colspanExtractor: (item: HTMLElement) => number): TGridMapData {
        const gridMap: Int8Array[] = [];
        const itemPlacements: WeakMap<HTMLElement, TGridItemPlacement> = new WeakMap();
        let firstAllowedRowIndFromFlow: number = 0;
        let firstAllowedColIndFromFlow: number = 0;
        itemsList.forEach((item, itemMarker) => {
            const rowspan: number = rowspanExtractor(item);
            const colspan: number = colspanExtractor(item);
            let currentRowInd: number = firstAllowedRowIndFromFlow;
            let currentColInd: number = firstAllowedColIndFromFlow;

            for (let tryNumber = 0; tryNumber < 100000; tryNumber++) {
                if (!gridMap[currentRowInd]) {
                    gridMap[currentRowInd] = GridUtils.createEmptyGridRow(columnCount, emptyMarker);
                }
                const currentRow: Int8Array = gridMap[currentRowInd];
                const insertColIndex: number | null = this.getFirstFreeColumnIndex(currentRow, currentColInd, colspan, emptyMarker);
                if (insertColIndex === null) {
                    currentRowInd += 1;
                    currentColInd = 0;
                    continue;
                }
                currentColInd = insertColIndex;
                this.extendMapShape(gridMap, currentRowInd, currentRowInd + rowspan, columnCount, emptyMarker);
                this.setItemInMap(gridMap, itemMarker, currentColInd, currentRowInd, rowspan, colspan);
                itemPlacements.set(item, {
                    colspan,
                    rowspan,
                    x: currentColInd,
                    y: currentRowInd
                })

                firstAllowedRowIndFromFlow = currentRowInd;
                firstAllowedColIndFromFlow = currentColInd + colspan;
                if (firstAllowedColIndFromFlow > columnCount - 1) {
                    firstAllowedRowIndFromFlow = currentRowInd + 1;
                    firstAllowedColIndFromFlow = 0;
                }
                break;
            }
        });
        return { gridMap, itemPlacements };
    }

    private static createEmptyGridRow(colCount: number, emptyMarker: number): Int8Array {
        return new Int8Array(colCount).fill(emptyMarker);
    }

    private static getFirstFreeColumnIndex(row: Int8Array, startIndex: number, columnspan: number, emptyMarker: number): number | null {
        let freeColumnIndex: number = null;
        const maxAllowedColumnIndex: number = Math.min(row.length - columnspan, row.length - 1);
        for (let colInd: number = startIndex; colInd <= maxAllowedColumnIndex; colInd++) {
            const slice: Int8Array = row.slice(colInd, colInd + columnspan);
            if (slice.every(ind => ind === emptyMarker)) {
                freeColumnIndex = colInd;
                break;
            }
        }
        return freeColumnIndex;
    }

    private static extendMapShape(map: Int8Array[], fromRowInd: number, toRowInd: number, columnCount: number, emptyMarker: number): void {
        for (let rowInd = fromRowInd; rowInd < toRowInd; rowInd++) {
            if (!map[rowInd]) {
                map[rowInd] = GridUtils.createEmptyGridRow(columnCount, emptyMarker);
            }
        }
    }

    private static setItemInMap(map: Int8Array[], marker: number, x: number, y: number, rowspan: number, colspan: number) {
        for (let rowInd = y; rowInd < y + rowspan; rowInd++) {
            const dataRow: number[] = new Array(colspan).fill(marker);
            map[rowInd].set(dataRow, x);
        }
    }

    public static calculateGridDimensions(gridElement: HTMLElement, gridMap: Int8Array[], columnCount: number, rowGap: number, columnGap: number, previousGridDimensions?: TGridDimensions | null): TGridDimensions {
        const rowCount: number = gridMap.length;
        if (previousGridDimensions && previousGridDimensions.rowCount === rowCount) {
            return { ...previousGridDimensions };
        }
        const computedProperties: CSSStyleDeclaration = window.getComputedStyle(gridElement);
        const rowHeights = computedProperties.gridTemplateRows.split(' ').map((value) => parseFloat(value));

        let columnWidths: number[];
        if (previousGridDimensions) {
            columnWidths = previousGridDimensions.columnWidths;
        } else {
            columnWidths = computedProperties.gridTemplateColumns.split(' ').map((value) => parseFloat(value));
        }
        return { columnCount, columnGap, columnWidths, rowCount, rowGap, rowHeights };
    }

    public static getGridCoordsFromPointer(gridClientX: number, gridClientY: number, gridDimensions: TGridDimensions): TCoords {
        let itemX: number = 0;
        let itemY: number = 0;
        let widthSum: number = 0;
        let heightSum: number = 0;
        for (let colInd: number = 0; colInd < gridDimensions.columnCount; colInd++) {
            itemX = colInd;
            const gapStep: number = colInd === 0 ? 0.5 * gridDimensions.columnGap : gridDimensions.columnGap;
            widthSum += gridDimensions.columnWidths[colInd] + gapStep;
            if (widthSum >= gridClientX) {
                break;
            }
        }
        for (let rowInd: number = 0; rowInd < gridDimensions.rowCount; rowInd++) {
            itemY = rowInd;
            const gapStep: number = rowInd === 0 ? 0.5 * gridDimensions.columnGap : gridDimensions.columnGap;
            heightSum += gridDimensions.rowHeights[rowInd] + gapStep;
            if (heightSum >= gridClientY) {
                break;
            }
        }
        return {
            x: itemX,
            y: itemY
        }
    }

    public static findFirstNonEmptyValueFromFlowLeft(gridMap: Int8Array[], fromCoords: TCoords, emptyMarker: number): number | null {
        const colCount: number = gridMap[fromCoords.y].length;
        let nonEmptyValue: number | null = null;
        scanner:
        for (let rowIndex = fromCoords.y; rowIndex >= 0; rowIndex--) {
            let fromCol: number = fromCoords.x;
            for (let columnIndex = fromCol; columnIndex >= 0; columnIndex--) {
                const currentValue: number = gridMap[rowIndex][columnIndex];
                if (currentValue !== emptyMarker) {
                    nonEmptyValue = currentValue;
                    break scanner;
                }
            }
            fromCol = colCount;
        }
        return nonEmptyValue;
    }
}