import { Utils } from "../../../utils/Utils";
import { ContainerFactory } from "../../Viewport/Factories/ContainerFactory/ContainerFactory";
import { Grid } from "../../Grid/Grid";
import { ItemWithTextFactory } from "../../Viewport/Factories/ItemFactory/ItemFactory";
import ItemFactoryAttributeHooks from "../../Viewport/Factories/ItemFactory/structures/ItemFactoryAttributeHooks";
import GridAttributeHooks from "../../Grid/structures/GridAttributeHooks";
import { TGrid } from "../../Grid/structures/TGrid";

export class GridDemo {

    constructor(container: HTMLElement) {
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const gridTemplate: string = require("./grid-demo.tpl.html");
        const gridElement: HTMLElement = Utils.createElementFromTemplate(gridTemplate);
        const containerElement: HTMLElement = ContainerFactory();
        gridElement.append(containerElement);
        container.append(gridElement);

        // this.loadTestScenario(containerElement);
        this.loadStuffedScenario(containerElement, 10, 10);
        // this.loadCustomScenario(containerElement);
    }

    private createPureItem(text: string, gradientColors: string[]): HTMLElement {
        const background: string = Utils.createLinearGradient(gradientColors[0], gradientColors[1], 90)
        const item: HTMLElement = ItemWithTextFactory(background, text);
        const itemHeader: HTMLElement = Utils.getElementByAttribute(item, ItemFactoryAttributeHooks.header);
        itemHeader.setAttribute(GridAttributeHooks.itemDragAnchor, '');
        itemHeader.style.cursor = 'pointer';
        return item;
    }

    private createClassItem(text: string, gradientColors: string[], rowspan: number, colspan: number): HTMLElement {
        const item = this.createPureItem(text, gradientColors);
        const classNames: string[] = [`grid-height-screen-${rowspan}`, `grid-width-screen-${colspan}`];
        item.classList.add(...classNames);
        return item;
    }

    private loadTestScenario(containerElement: HTMLElement): void {
        const numberOfItems: number = 20;
        const maxColSpan: number = 4;
        const maxRowSpan: number = 4;
        const gridParams: TGrid = {
            allowDynamicClassChange: true,
            colCount: 20,
            colGap: 30
        }
        const grid: Grid = new Grid(containerElement, gridParams);
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let i = 0; i < numberOfItems; i++) {
            const rowspan: number = Math.floor(Math.random() * (maxRowSpan)) + 1;
            const colspan: number = Math.floor(Math.random() * (maxColSpan)) + 1;
            const item: HTMLElement = this.createClassItem(i.toString(), gradientColors[i % gradientColors.length], rowspan, colspan);
            grid.addItemWithClass(item);
        }
    }

    private loadStuffedScenario(containerElement: HTMLElement, colCount: number, rowCount: number): void {
        const gridParams: TGrid = {
            allowDynamicClassChange: false,
            colCount: colCount,
            colGap: 10
        }
        const grid: Grid = new Grid(containerElement, gridParams);
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let rowInd = 0; rowInd < rowCount; rowInd++) {
            for (let colInd = 0; colInd < colCount; colInd++) {
                const rowspan: number = 1;
                const colspan: number = 1;
                const item: HTMLElement = this.createClassItem(`[${rowInd}, ${colInd}]`, gradientColors[colInd % gradientColors.length], 1, 1);
                grid.addItemWithClass(item);
            }
        }
    }

    private loadCustomScenario(containerElement: HTMLElement) {
        const grid: Grid = new Grid(containerElement, {
            colCount: 5,
            colGap: 30,
            allowDynamicClassChange: true
        });
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        const zero: HTMLElement = this.createClassItem('0', gradientColors[0], 1, 3);
        const one: HTMLElement = this.createClassItem('1', gradientColors[1], 1, 2);
        const two: HTMLElement = this.createClassItem('2', gradientColors[2], 1, 3);
        const three: HTMLElement = this.createClassItem('3', gradientColors[3], 4, 1);
        const four: HTMLElement = this.createClassItem('4', gradientColors[4], 1, 3);

        [zero, one, two, three, four].forEach(item => grid.addItemWithClass(item));
    }
}