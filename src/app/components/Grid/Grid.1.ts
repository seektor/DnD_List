// import { Utils } from "../../utils/Utils";
// import { TDragStartData } from "../List/structures/TDragStartData";
// import { TCoordinates } from "../../structures/TCoordinates";
// import { TTranslate } from "../../utils/smooth-translate/structures/TTranslate";
// import { smoothTranslate } from "../../utils/smooth-translate/smoothTranslate";

// export type GridParams = {
//     numberOfColumns: number;
//     numberOfRows: number;
//     rowHeight: number;
// }

// export type Point2D = [number, number];

// export class Grid {

//     private gridElement: HTMLElement;
//     private gridParams: GridParams;

//     private isDragging: boolean = false;
//     private dragStartData: TDragStartData;
//     private draggedElement: HTMLElement;
//     private placeholderElement: HTMLElement;
//     private instantTranslateClass: string = 'item--translate-instant';
//     private lastHoveredOverItem: HTMLElement;

//     private gridItemList: HTMLElement[];
//     private gridMap: number[][];
//     private originalIndexMap: WeakMap<HTMLElement, number> = new WeakMap();

//     private itemAttribute: string = 'grid-item';

//     // view params
//     private columnWidths: number[];
//     private columnsGap: number;
//     private rowHeights: number[];
//     private rowsGap: number;
//     stopForNow: boolean;

//     constructor(container: HTMLElement, gridParams: GridParams) {
//         this.gridParams = gridParams;
//         this.constructComponent(container, gridParams);

//         this.onDragStart = this.onDragStart.bind(this);
//         this.onDragMove = this.onDragMove.bind(this);
//         this.onDragEnd = this.onDragEnd.bind(this);
//     }

//     private constructComponent(container: HTMLElement, gridParams: GridParams) {
//         const gridTemplate: string = require("./grid.tpl.html");
//         const gridElement: HTMLElement = Utils.createElementFromTemplate(gridTemplate);
//         this.gridElement = gridElement;
//         this.gridElement.style.gridTemplateColumns = `repeat(${gridParams.numberOfColumns}, 1fr)`;
//         this.gridElement.style.gridTemplateRows = `repeat(${gridParams.numberOfRows}, ${gridParams.rowHeight}px)`
//         container.append(gridElement);
//         this.updateColumnWidthsData();
//         this.updateRowsHeightsData();
//         console.log(this.rowHeights);
//         console.log(this.columnWidths);
//         this.placeholderElement = this.createPlacholderElement();
//     }

//     private createPlacholderElement(): HTMLElement {
//         const element: HTMLElement = document.createElement('div');
//         element.setAttribute('grid-item', '');
//         element.style.backgroundColor = "black";
//         element.style.width = "100%";
//         element.style.height = "100%";
//         return element;
//     }

//     private updateColumnWidthsData() {
//         const computedProperties: CSSStyleDeclaration = window.getComputedStyle(this.gridElement);
//         const columnWidths = computedProperties.gridTemplateColumns.split(' ').map((value) => parseFloat(value));
//         const widthsSum: number = columnWidths.reduce((sum, current) => sum += current, 0);
//         const columnsGap: number = (this.gridElement.clientWidth - widthsSum) / (this.gridParams.numberOfColumns - 1);
//         this.columnWidths = columnWidths;
//         this.columnsGap = columnsGap;
//     }

//     private updateRowsHeightsData() {
//         const computedProperties: CSSStyleDeclaration = window.getComputedStyle(this.gridElement);
//         const rowHeights = computedProperties.gridTemplateRows.split(' ').map((value) => parseFloat(value));
//         const heightsSum: number = rowHeights.reduce((sum, current) => sum += current, 0);
//         const rowsGap: number = (this.gridElement.clientHeight - heightsSum) / (this.gridParams.numberOfRows - 1);
//         this.rowHeights = rowHeights;
//         this.rowsGap = rowsGap;
//     }

//     public addItemByContentSize(content: HTMLElement, width: number, height: number) {
//         const itemWidth: number = width;
//         let itemColSpan: number = 1;
//         const itemHeight: number = height;
//         let itemRowSpan: number = 1;

//         let currentWidth: number = 0;
//         for (let colNumber = 0; colNumber < this.gridParams.numberOfColumns; colNumber++) {
//             currentWidth += this.columnWidths[colNumber];
//             if (itemWidth <= currentWidth) {
//                 itemColSpan += colNumber;
//                 break;
//             }
//             currentWidth += this.columnsGap;
//         }
//         itemColSpan = Math.min(itemColSpan, this.gridParams.numberOfColumns);

//         let currentHeight: number = 0;
//         for (let rowNumber = 0; rowNumber < this.gridParams.numberOfRows; rowNumber++) {
//             currentHeight += this.rowHeights[rowNumber];
//             if (itemHeight <= currentHeight) {
//                 itemRowSpan += rowNumber;
//                 break;
//             }
//             currentHeight += this.rowsGap;
//         }
//         itemRowSpan = Math.min(itemRowSpan, this.gridParams.numberOfRows);
//         const item: HTMLElement = this.getWrappedContent(content);
//         item.style.gridColumn = `span ${itemColSpan}`;
//         item.style.gridRow = `span ${itemRowSpan}`;
//         this.gridElement.append(item);
//     }

//     public addItemByOccupiedPlace(content: HTMLElement, rowSpan: number, colSpan: number) {
//         const item: HTMLElement = this.getWrappedContent(content);
//         item.style.gridColumn = `span ${colSpan}`;
//         item.setAttribute('data-colspan', colSpan.toString());
//         item.style.gridRow = `span ${rowSpan}`;
//         item.setAttribute('data-rowspan', rowSpan.toString());
//         this.gridElement.append(item);
//     }

//     private getWrappedContent(content: HTMLElement) {
//         const wrapper: HTMLElement = document.createElement('div');
//         wrapper.setAttribute(this.itemAttribute, '');
//         wrapper.classList.add('item--translate-smooth');
//         const dragAnchor: HTMLElement = Utils.getElementByAttribute(content, 'list-item__drag-anchor');
//         dragAnchor.addEventListener('mousedown', this.onDragStart);
//         wrapper.append(content);
//         return wrapper;
//     }

//     private onDragStart(e: MouseEvent) {
//         this.isDragging = true;
//         this.dragStartData = {
//             initialCoordinates: { x: e.clientX, y: e.clientY },
//             initialComponentScrollTop: this.gridElement.scrollTop,
//             initialComponentTop: this.gridElement.getBoundingClientRect().top,
//         }
//         const clickedElement: HTMLElement = e.currentTarget as HTMLElement;
//         const itemElement: HTMLElement = clickedElement.closest('[grid-item]') as HTMLElement;
//         this.draggedElement = itemElement;
//         this.draggedElement.style.pointerEvents = 'none';
//         const itemRowspan: number = parseFloat(itemElement.getAttribute('data-rowspan'));
//         this.placeholderElement.style.gridColumn = itemElement.style.gridColumn;
//         this.placeholderElement.setAttribute('data-rowspan', itemRowspan.toString());
//         const itemColspan: number = parseFloat(itemElement.getAttribute('data-colspan'))
//         this.placeholderElement.style.gridRow = itemElement.style.gridRow;
//         this.placeholderElement.setAttribute('data-colspan', itemColspan.toString());
//         itemElement.after(this.placeholderElement);
//         this.detachDraggedElement();
//         this.gridItemList = [...this.gridElement.children].filter(child => child !== itemElement) as HTMLElement[];
//         this.gridItemList.forEach((item, index) => this.originalIndexMap.set(item, index));
//         this.gridMap = this.createGridMap(this.gridItemList);
//         console.log(this.gridMap);

//         document.addEventListener("mousemove", this.onDragMove);
//         document.addEventListener("mouseup", this.onDragEnd);
//     }

//     private onDragMove(e: MouseEvent): void {
//         const xTranslation: number = e.clientX - this.dragStartData.initialCoordinates.x;
//         const yTranslation: number = e.clientY - this.dragStartData.initialCoordinates.y;
//         this.setTranslation(this.draggedElement, xTranslation, yTranslation);
//         const elementFromPoint: HTMLElement | null = this.getItemFomPoint(e.clientX, e.clientY);
//         if (elementFromPoint !== null && this.lastHoveredOverItem !== elementFromPoint && elementFromPoint !== this.placeholderElement) {
//             this.lastHoveredOverItem = elementFromPoint;
//             this.superComplicatedFunction(elementFromPoint);
//         }
//         // console.log(elementFromPoint);
//     }

//     private superComplicatedFunction(hoveredOverElement: HTMLElement) {
//         const placeholderIndex: number = this.gridItemList.indexOf(this.placeholderElement);
//         const hoveredItemIndex: number = this.gridItemList.indexOf(hoveredOverElement);
//         // [this.gridItemList[placeholderIndex], this.gridItemList[hoveredItemIndex]] = [this.gridItemList[hoveredItemIndex], this.gridItemList[placeholderIndex]];
//         this.gridItemList.splice(hoveredItemIndex, 0, this.gridItemList.splice(placeholderIndex, 1)[0]);
//         console.log(this.gridItemList);
//         const newMap: number[][] = this.createGridMap(this.gridItemList);
//         console.log(newMap);
//         if (!this.stopForNow) {
//             this.prepareAnimations(this.gridMap, newMap);
//         }
//     }

//     private prepareAnimations(oldMap: number[][], newMap: number[][]) {
//         let translations: TTranslate[] = [];
//         this.gridItemList.forEach((item) => {
//             const marker: number = this.originalIndexMap.get(item);
//             const oldPosition: Point2D = this.findFirstOccurence(oldMap, marker);
//             const newPosition: Point2D = this.findFirstOccurence(newMap, marker);
//             if (oldPosition[0] !== newPosition[0] || oldPosition[1] !== newPosition[1]) {
//                 const xTranslateValue: number = this.createRange(oldPosition[0], newPosition[0]).reduce((sum, curr) => sum += this.columnWidths[curr] + this.columnsGap, 0) * Math.sign(newPosition[0] - oldPosition[0]);
//                 const yTranslateValue: number = this.createRange(oldPosition[1], newPosition[1]).reduce((sum, curr) => sum += this.rowHeights[curr] + this.rowsGap, 0) * Math.sign(newPosition[1] - oldPosition[1]);
//                 console.log(xTranslateValue, yTranslateValue);
//                 // this.setTranslation(item, xTranslateValue, yTranslateValue);
//                 translations.push({
//                     currentX: 0,
//                     currentY: 0,
//                     element: item,
//                     targetX: xTranslateValue,
//                     targetY: yTranslateValue,
//                 })
//             }
//         });
//         smoothTranslate(translations, 3000, () => console.warn("DONE"));
//         this.stopForNow = true;
//     }

//     private createRange(from: number, to: number): number[] {
//         const length: number = Math.abs(from - to);
//         const baseArray: number[] = [...new Array(length).keys()];
//         if (from <= to) {
//             return baseArray;
//         } else {
//             return baseArray.reverse();
//         }
//     }

//     private findFirstOccurence(map: number[][], marker: number): Point2D {
//         // This map coordinates map can be prepared during map creation.
//         for (let row = 0; row < this.gridParams.numberOfRows; row++) {
//             for (let col = 0; col < this.gridParams.numberOfColumns; col++) {
//                 if (map[row][col] === marker) {
//                     return [col, row];
//                 }
//             }
//         }
//     }

//     private getItemFomPoint(x: number, y: number): HTMLElement | null {
//         const elementFromPoint: HTMLElement = document.elementFromPoint(x, y) as HTMLElement;
//         const item: HTMLElement | null = elementFromPoint.closest(`[${this.itemAttribute}]`) as HTMLElement;
//         return item;
//     }

//     private onDragEnd(e: MouseEvent): void {
//         this.isDragging = false;
//         this.draggedElement.classList.remove(this.instantTranslateClass);
//         this.removeTranslation(this.draggedElement);
//         document.removeEventListener("mouseup", this.onDragEnd);
//         document.removeEventListener("mousemove", this.onDragMove);
//     }

//     private detachDraggedElement(): void {
//         const draggedElementClientRect: ClientRect = this.draggedElement.getBoundingClientRect();
//         this.draggedElement.style.top = `${draggedElementClientRect.top}px`;
//         this.draggedElement.style.left = `${draggedElementClientRect.left}px`;
//         this.draggedElement.style.width = `${this.draggedElement.offsetWidth}px`;
//         this.draggedElement.style.height = `${this.draggedElement.offsetHeight}px`;
//         this.draggedElement.classList.add('item--translate-instant');
//         this.draggedElement.style.zIndex = "1";
//         this.draggedElement.style.pointerEvents = "none";
//         this.draggedElement.style.position = "fixed";
//     }

//     private setTranslation(element: HTMLElement, x: number, y: number): void {
//         element.style.transform = `translate(${x}px, ${y}px)`;
//     }

//     private createGridMap(gridItemsList: HTMLElement[]): number[][] {
//         const map: number[][] = this.createEmptyGridMap();
//         let fromCoords: TCoordinates = { x: 0, y: 0 };
//         const startingBorders = { x: 0, y: 0, colspan: 0, rowspan: 0 };
//         gridItemsList.forEach((gridItem) => {
//             const indexMarker: number = this.originalIndexMap.get(gridItem);
//             const rowSpan: number = parseFloat(gridItem.getAttribute('data-rowspan'));
//             const colSpan: number = parseFloat(gridItem.getAttribute('data-colspan'));
//             let coords: TCoordinates = { ...fromCoords };
//             // Missing column validation
//             for (let sRow = coords.y; sRow <= this.gridParams.numberOfRows; sRow++) {
//                 if (coords.x + colSpan <= this.gridParams.numberOfColumns) {
//                     this.setGridMapItem(map, indexMarker, coords, rowSpan, colSpan);
//                     let nextFromX: number = coords.x + colSpan;
//                     let nextFromY: number = coords.y;
//                     if (nextFromX >= this.gridParams.numberOfColumns) {
//                         nextFromX = 0;
//                         nextFromY += 1;
//                     }
//                     fromCoords = { x: nextFromX, y: nextFromY };
//                     break;
//                 } else {
//                     coords.y += 1;
//                     coords.x = map[coords.y].indexOf(-1);
//                 }
//             }
//         })
//         return map;
//     }

//     private setGridMapItem(gridMap: number[][], listIndex: number, coords: TCoordinates, rowspan: number, colspan: number) {
//         for (let row = coords.y; row < coords.y + rowspan; row++) {
//             for (let col = coords.x; col < coords.x + colspan; col++) {
//                 gridMap[row][col] = listIndex;
//             }
//         }
//     }

//     private createEmptyGridMap(): number[][] {
//         const map: number[][] = [];
//         for (let rowIndex = 0; rowIndex < this.gridParams.numberOfRows; rowIndex++) {
//             map.push(new Array(this.gridParams.numberOfColumns).fill(-1));
//         }
//         return map;
//     }

//     private removeTranslation(element: HTMLElement): void {
//         element.style.transform = '';
//     }
// }