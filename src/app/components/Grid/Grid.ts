import { Utils } from "../../utils/Utils";
import { TCoordinates } from "../../structures/TCoordinates";
import { TGrid } from "./structures/TGrid";
import GridAttributeHooks from "./structures/GridAttributeHooks";
import { TGridItemProperties } from "./structures/TGridItemProperties";

export class Grid {

    private gridElement: HTMLElement;
    private placeholderElement: HTMLElement;

    private readonly itemAttr: string = GridAttributeHooks.item;
    private readonly rowspanAttr: string = 'data-rowspan';
    private readonly colspanAttr: string = 'data-colspan';

    private columnsCount: number;
    private numberOfRows: number;
    private columnGap: number;
    private columnWidths: number[];
    private rowHeights: number[];
    private itemToMarkerMap: WeakMap<HTMLElement, number>;
    private emptyMarker: number = -1;
    private allowDynamicClassChange: boolean;


    constructor(container: HTMLElement, params: TGrid) {
        this.processParams(params);
        this.bindMethods();
        this.constructComponent(container, params);
    }

    private processParams(params: TGrid) {
        this.columnsCount = params.numberOfColumns;
        this.columnGap = params.columnGap;
        this.allowDynamicClassChange = params.allowDynamicClassChange;
    }

    private bindMethods(): void {
        this.onDragStart = this.onDragStart.bind(this);
    }

    private constructComponent(container: HTMLElement, params: TGrid) {
        const gridTemplate: string = require("./grid.tpl.html");
        const gridElement: HTMLElement = Utils.createElementFromTemplate(gridTemplate);
        gridElement.style.gridTemplateColumns = `repeat(${params.numberOfColumns}, 1fr)`;
        gridElement.style.columnGap = `${params.columnGap}px`;
        this.gridElement = gridElement;
        container.append(gridElement);

        this.itemToMarkerMap = this.createItemToMarkerMap();
        this.placeholderElement = this.createPlaceholderElement();
        // this.updateColumnWidthsData();
        // this.updateRowsHeightsData();
        // console.log(this.rowHeights);
        // console.log(this.columnWidths);
        // this.placeholderElement = this.createPlacholderElement();
    }

    private createItemToMarkerMap(): WeakMap<HTMLElement, number> {
        const map: WeakMap<HTMLElement, number> = new WeakMap();
        ([...this.gridElement.children] as HTMLElement[]).forEach((child, ind) => map.set(child, ind));
        return map;
    }

    private createPlaceholderElement(): HTMLElement {
        const template: string = require('./templates/placeholder.tpl.html');
        const placeholderElement: HTMLElement = Utils.createElementFromTemplate(template);
        return placeholderElement;
    }

    public addItemByStyle(content: HTMLElement, rowspan: number, colspan: number) {
        const item: HTMLElement = this.createItem(content);
        this.setItemDisplayProps(item, rowspan, colspan);
        this.gridElement.append(item);
    }

    public addItemWithClass(content: HTMLElement) {
        const item: HTMLElement = this.createItem(content);
        this.gridElement.append(item);
        const itemProperties: TGridItemProperties = this.getGridItemProperties(item);
        this.setItemDisplayProps(item, itemProperties.rowspan, itemProperties.colspan);
        if (this.allowDynamicClassChange) {
            this.setClassObserver(item);
        }
    }

    private setClassObserver(item: HTMLElement): void {
        const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
            const itemProperties: TGridItemProperties = this.getGridItemProperties(item);
            this.setItemDisplayProps(item, itemProperties.rowspan, itemProperties.colspan);
        });
        observer.observe(item, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    private setItemDisplayProps(item: HTMLElement, rowspan: number, colspan: number): void {
        item.setAttribute(this.rowspanAttr, rowspan.toString());
        item.setAttribute(this.colspanAttr, colspan.toString());
    }

    private getGridItemProperties(item: HTMLElement): TGridItemProperties {
        const computedProperties: CSSStyleDeclaration = window.getComputedStyle(item);
        const rowspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridRowStart);
        const colspanProperty: RegExpExecArray | null = /span \d/.exec(computedProperties.gridColumnStart);
        const rowspan: number = rowspanProperty === null ? 0 : parseInt(rowspanProperty[0].split(' ')[1]);
        const colspan: number = colspanProperty === null ? 0 : parseInt(colspanProperty[0].split(' ')[1]);
        return {
            colspan: rowspan,
            rowspan: colspan,
        }
    }

    private createItem(content: HTMLElement): HTMLElement {
        const clonedItem: HTMLElement = content.cloneNode(true) as HTMLElement;
        clonedItem.setAttribute(this.itemAttr, '');
        const dragAnchor: HTMLElement = Utils.getElementByAttribute(clonedItem, GridAttributeHooks.itemDragAnchor);
        if (!dragAnchor) {
            throw new Error('Provided element has no dragAnchor attribute!');
        }
        dragAnchor.addEventListener('mousedown', this.onDragStart);
        return clonedItem;
    }

    private updateNumberOfRows() {

    }

    private updateRowHeights() {
        // const computedProperties: CSSStyleDeclaration = window.getComputedStyle(this.gridElement);
        // const rowHeights = computedProperties.gridTemplateRows.split(' ').map((value) => parseFloat(value));
        // const heightsSum: number = rowHeights.reduce((sum, current) => sum += current, 0);
        // const rowsGap: number = (this.gridElement.clientHeight - heightsSum) / (this.gridParams.numberOfRows - 1);
        // this.rowHeights = rowHeights;
        // this.rowsGap = rowsGap;
    }

    // private createGridMap(itemsList: HTMLElement[]): Int8Array[] {
    //     const gridMap: Int8Array[] = [];
    //     const nextAllowedRowInd: number = 0;
    //     itemsList.forEach(item => {
    //         const itemMarker: number = this.itemToMarkerMap.get(item);
    //         const rowspan: number = parseFloat(item.getAttribute('data-rowspan'));
    //         const colspan: number = parseFloat(item.getAttribute('data-colspan'));

    //         let currentRowInd: number = nextAllowedRowInd;
    //         let isSet: boolean = false;

    //         while (!isSet) {
    //             if (!gridMap[currentRowInd]) {
    //                 gridMap[currentRowInd] = new Int8Array(this.columnsCount).fill(this.emptyMarker);
    //             }
    //             const currentRow: Int8Array = gridMap[currentRowInd];

    //             let potentialXCoord: number = this.columnsCount + 1;
    //             for (let colInd = this.columnsCount - 1; colInd >= 0; colInd--) {
    //                 if (currentRow[colInd] === this.emptyMarker) {
    //                     potentialXCoord = colInd + 1;
    //                 }
    //             }

    //             if (potentialXCoord + colspan > this.columnsCount) {
    //                 currentRowInd += 1;
    //             } else {
    //                 for (let rowInd = currentRowInd + 1; rowInd < currentRowInd + rowspan; rowInd++) {
    //                     if (!gridMap[rowInd]) {
    //                         gridMap[rowInd] = new Int8Array(this.columnsCount);
    //                     }
    //                 }

    //                 isSet = true;
    //             }
    //         }
    //     });
    // }

    private setItemInMap(map: Int8Array[], marker: number, x: number, y: number, rowspan: number, colspan: number) {
        for (let rowInd = y; rowInd < y + rowspan; rowInd++) {
            for (let colInd = x; colInd < x + colspan; colInd++) {
                map[rowInd][colInd] = marker;
            }
        }
    }

    private onDragStart(e: MouseEvent) {
        // this.isDragging = true;
        // this.dragStartData = {
        //     initialCoordinates: { x: e.clientX, y: e.clientY },
        //     initialComponentScrollTop: this.gridElement.scrollTop,
        //     initialComponentTop: this.gridElement.getBoundingClientRect().top,
        // }
        // const clickedElement: HTMLElement = e.currentTarget as HTMLElement;
        // const itemElement: HTMLElement = clickedElement.closest('[grid-item]') as HTMLElement;
        // this.draggedElement = itemElement;
        // this.draggedElement.style.pointerEvents = 'none';
        // const itemRowspan: number = parseFloat(itemElement.getAttribute('data-rowspan'));
        // this.placeholderElement.style.gridColumn = itemElement.style.gridColumn;
        // this.placeholderElement.setAttribute('data-rowspan', itemRowspan.toString());
        // const itemColspan: number = parseFloat(itemElement.getAttribute('data-colspan'))
        // this.placeholderElement.style.gridRow = itemElement.style.gridRow;
        // this.placeholderElement.setAttribute('data-colspan', itemColspan.toString());
        // itemElement.after(this.placeholderElement);
        // this.detachDraggedElement();
        // this.gridItemList = [...this.gridElement.children].filter(child => child !== itemElement) as HTMLElement[];
        // this.gridItemList.forEach((item, index) => this.originalIndexMap.set(item, index));
        // this.gridMap = this.createGridMap(this.gridItemList);
        // console.log(this.gridMap);

        // document.addEventListener("mousemove", this.onDragMove);
        // document.addEventListener("mouseup", this.onDragEnd);
    }

}