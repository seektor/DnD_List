import { Utils } from "../../../utils/Utils";
import { ContainerFactory } from "../../Viewport/Factories/ContainerFactory/ContainerFactory";
import { Grid } from "../../Grid/Grid";
import { ItemWithTextFactory } from "../../Viewport/Factories/ItemFactory/ItemFactory";
import ItemFactoryAttributeHooks from "../../Viewport/Factories/ItemFactory/structures/ItemFactoryAttributeHooks";
import GridAttributeHooks from "../../Grid/structures/GridAttributeHooks";
import { TGridParams } from "../../Grid/structures/TGridParams";

export class GridDemo {

    private gridParams: TGridParams = {
        columnCount: 12,
        columnGap: 30,
        rowGap: 30,
        watchAnyResize: false,
        allowDynamicClassChange: true,
    }

    constructor(container: HTMLElement) {
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const gridTemplate: string = require("./grid-demo.tpl.html");
        const gridElement: HTMLElement = Utils.createElementFromTemplate(gridTemplate);
        const containerElement: HTMLElement = ContainerFactory();
        gridElement.append(containerElement);
        container.append(gridElement);

        // this.load1x1Scenario(containerElement, 2, 8);
        this.loadInterlacedScenario(containerElement, 20);
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

    private load1x1Scenario(containerElement: HTMLElement, rowCount: number, columnCount: number): void {
        const grid: Grid = new Grid(containerElement, this.gridParams);
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                const item: HTMLElement = this.createClassItem(`[${rowIndex}, ${columnIndex}]`, gradientColors[columnIndex % gradientColors.length], 1, 1);
                grid.addItemWithClass(item);
            }
        }
    }

    private loadInterlacedScenario(containerElement: HTMLElement, itemCount: number): void {
        const grid: Grid = new Grid(containerElement, this.gridParams);
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
            const size: number = itemIndex % 2 === 0 ? 2 : 1;
            const item: HTMLElement = this.createClassItem(`${itemIndex}`, gradientColors[itemIndex % gradientColors.length], size, size);
            grid.addItemWithClass(item);
        }
    }
}