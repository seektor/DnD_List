import { TGridMapData } from "../structures/TGridMapData";
import { TGridDimensions } from "../structures/TGridDimensions";
import { TCoords } from "../../../structures/TCoords";
import { TGridItemPlacement } from "../structures/TGridItemPlacement";
import { TGridParams } from "../structures/TGridParams";
import { TGridItemProperties } from "../structures/TGridItemProperties";

export class GridUtils {

    public static setGridTemplateColumns(gridElement: HTMLElement, gridParentElement: HTMLElement, gridParams: TGridParams): void {
        const columnWidth: number = this.calculateColumnWidth(gridParentElement, gridParams);
        gridElement.style.gridTemplateColumns = `repeat(${gridParams.columnCount}, ${columnWidth}px)`;
    }

    public static setGridGaps(gridElement: HTMLElement, rowGap: number, columnGap: number): void {
        gridElement.style.rowGap = `${rowGap}px`;
        gridElement.style.columnGap = `${columnGap}px`;
    }

    private static calculateColumnWidth(gridParentElement: HTMLElement, gridParams: TGridParams): number {
        const parentStyles: CSSStyleDeclaration = window.getComputedStyle(gridParentElement);
        const gridContentWidth: number = gridParentElement.clientWidth - parseFloat(parentStyles.paddingLeft) - parseFloat(parentStyles.paddingRight);
        const calculatedColumnWidth: number = (gridContentWidth - ((gridParams.columnCount - 1) * gridParams.columnGap)) / gridParams.columnCount;
        return Math.max(calculatedColumnWidth, gridParams.minColumnWidth || 0);
    }

    public static getGridItemProperties(item: HTMLElement, columnCount: number): TGridItemProperties {
        const computedProperties: CSSStyleDeclaration = window.getComputedStyle(item);
        const rowspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridRowStart);
        const colspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridColumnStart);
        const rowspan: number = rowspanProperty === null ? 1 : parseInt(rowspanProperty[0].split(' ')[1]);
        const colspan: number = colspanProperty === null ? 1 : Math.min(parseInt(colspanProperty[0].split(' ')[1]), columnCount);
        return {
            colspan: colspan,
            rowspan: rowspan,
        }
    }

    public static createGridDataView(itemsList: HTMLElement[], columnCount: number, emptyMarker: number, rowspanExtractor: (item: HTMLElement) => number, colspanExtractor: (item: HTMLElement) => number): TGridMapData {
        const gridMap: Int16Array[] = [];
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
                const currentRow: Int16Array = gridMap[currentRowInd];
                const insertColIndex: number | null = this.getFirstEmptyColumnIndex(currentRow, currentColInd, colspan, emptyMarker);
                if (insertColIndex === null) {
                    currentRowInd += 1;
                    currentColInd = 0;
                    continue;
                }
                currentColInd = insertColIndex;
                this.assertMapShape(gridMap, currentRowInd, currentRowInd + rowspan, columnCount, emptyMarker);
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

    private static createEmptyGridRow(colCount: number, emptyMarker: number): Int16Array {
        return new Int16Array(colCount).fill(emptyMarker);
    }

    private static getFirstEmptyColumnIndex(row: Int16Array, startIndex: number, columnspan: number, emptyMarker: number): number | null {
        let emptyColumnIndex: number = null;
        const maxAllowedColumnIndex: number = Math.min(row.length - columnspan, row.length - 1);
        for (let colInd: number = startIndex; colInd <= maxAllowedColumnIndex; colInd++) {
            const slice: Int16Array = row.slice(colInd, colInd + columnspan);
            if (slice.every(ind => ind === emptyMarker)) {
                emptyColumnIndex = colInd;
                break;
            }
        }
        return emptyColumnIndex;
    }

    private static assertMapShape(map: Int16Array[], fromRowInd: number, toRowInd: number, columnCount: number, emptyMarker: number): void {
        for (let rowInd = fromRowInd; rowInd < toRowInd; rowInd++) {
            if (!map[rowInd]) {
                map[rowInd] = GridUtils.createEmptyGridRow(columnCount, emptyMarker);
            }
        }
    }

    private static setItemInMap(map: Int16Array[], marker: number, x: number, y: number, rowspan: number, colspan: number): void {
        for (let rowInd = y; rowInd < y + rowspan; rowInd++) {
            const dataRow: number[] = new Array(colspan).fill(marker);
            map[rowInd].set(dataRow, x);
        }
    }

    // grid [arams]
    public static calculateGridDimensions(gridElement: HTMLElement, gridMap: Int16Array[], columnCount: number, rowGap: number, columnGap: number, previousGridDimensions?: TGridDimensions | null): TGridDimensions {
        const rowCount: number = gridMap.length;
        if (previousGridDimensions && previousGridDimensions.rowCount === rowCount) {
            return { ...previousGridDimensions };
        }
        const computedProperties: CSSStyleDeclaration = window.getComputedStyle(gridElement);
        const extractedRowHeight: number = parseFloat(computedProperties.gridTemplateRows.split(' ')[0]);
        const rowHeight: number = isNaN(extractedRowHeight) ? 0 : extractedRowHeight;

        let columnWidth: number;
        if (previousGridDimensions) {
            columnWidth = previousGridDimensions.columnWidth;
        } else {
            const extractedColumnWidth: number = parseFloat(computedProperties.gridTemplateColumns.split(' ')[0]);
            columnWidth = isNaN(extractedColumnWidth) ? 0 : extractedColumnWidth;
        }
        return { columnCount, columnGap, columnWidth, rowCount, rowGap, rowHeight };
    }

    public static calculateGridCoords(gridClientX: number, gridClientY: number, gridDimensions: TGridDimensions): TCoords {
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

    public static findFirstItemMarkerUsingLeftFlow(gridMap: Int16Array[], fromCoords: TCoords, emptyMarker: number): number | null {
        const columnCount: number = gridMap[fromCoords.y].length;
        let itemMarker: number | null = null;
        let currentColumnIndex: number = fromCoords.x;
        scanner:
        for (let rowIndex = fromCoords.y; rowIndex >= 0; rowIndex--) {
            for (let columnIndex = currentColumnIndex; columnIndex >= 0; columnIndex--) {
                const currentValue: number = gridMap[rowIndex][columnIndex];
                if (currentValue !== emptyMarker) {
                    itemMarker = currentValue;
                    break scanner;
                }
            }
            currentColumnIndex = columnCount - 1;
        }
        return itemMarker;
    }
}