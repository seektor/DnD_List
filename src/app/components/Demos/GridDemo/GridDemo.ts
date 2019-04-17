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

        this.load1x1Scenario(containerElement, 2, 20);

        // this.loadLoadTestScenario(containerElement);
        // this.loadStuffedScenario(containerElement, 10, 10);
        // this.loadDynamicHeightScenario(containerElement);
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

    private loadLoadTestScenario(containerElement: HTMLElement): void {
        const numberOfItems: number = 20;
        const maxColSpan: number = 2;
        const maxRowSpan: number = 3;
        const gridParams: TGrid = {
            allowDynamicClassChange: true,
            columnCount: 20,
            rowGap: 30,
            columnGap: 30
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

    private load1x1Scenario(containerElement: HTMLElement, rowCount: number, columnCount: number): void {
        const gridParams: TGrid = {
            allowDynamicClassChange: false,
            rowGap: 10,
            columnCount: columnCount,
            columnGap: 10
        }
        const grid: Grid = new Grid(containerElement, gridParams);
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const item: HTMLElement = this.createClassItem(`[${rowIndex}, ${columnIndex}]`, gradientColors[columnIndex % gradientColors.length], 1, 1);
                grid.addItemWithClass(item);
            }
        }
    }

    private loadDynamicHeightScenario(containerElement: HTMLElement) {
        const grid: Grid = new Grid(containerElement, {
            columnCount: 5,
            rowGap: 30,
            columnGap: 30,
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

    private loadSingleRowScenario(containerElement: HTMLElement, columnCount: number, itemCount: number) {
        const grid: Grid = new Grid(containerElement, {
            columnCount: columnCount,
            rowGap: 30,
            columnGap: 30,
            allowDynamicClassChange: false
        });
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        let itemIndex: number = 0;
        for (let columnInd = 0; columnInd < itemCount; columnInd++) {
            const colspan: number = Utils.getRandomInt(1, 2);
            const item: HTMLElement = this.createClassItem(`>>> ${itemIndex} <<<`, gradientColors[columnInd % gradientColors.length], 1, colspan);
            itemIndex++;
            grid.addItemWithClass(item);
        }
    }

    private loadCustomScenario(containerElement: HTMLElement) {
        const grid: Grid = new Grid(containerElement, {
            columnCount: 5,
            rowGap: 30,
            columnGap: 30,
            allowDynamicClassChange: true
        });
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        const zero: HTMLElement = this.createClassItem('0', gradientColors[0], 3, 1);
        const one: HTMLElement = this.createClassItem('1', gradientColors[1], 1, 2);
        [zero, one].forEach(item => grid.addItemWithClass(item));
    }
}