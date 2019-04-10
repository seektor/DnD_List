import { Utils } from "../../../utils/Utils";
import { ContainerFactory } from "../../Viewport/Factories/ContainerFactory/ContainerFactory";
import { Grid } from "../../Grid/Grid";
import { ItemWithTextFactory } from "../../Viewport/Factories/ItemFactory/ItemFactory";
import ItemFactoryAttributeHooks from "../../Viewport/Factories/ItemFactory/structures/ItemFactoryAttributeHooks";
import GridAttributeHooks from "../../Grid/structures/GridAttributeHooks";

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

        const grid: Grid = new Grid(containerElement, {
            numberOfColumns: 8,
            columnGap: 30,
            allowDynamicClassChange: true
        });

        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let i = 0; i < 6; i++) {
            const currentGradientColors: string[] = gradientColors[i % gradientColors.length];
            const background: string = Utils.createLinearGradient(currentGradientColors[0], currentGradientColors[1], 90)
            const item: HTMLElement = ItemWithTextFactory(background, i.toString());
            const itemHeader: HTMLElement = Utils.getElementByAttribute(item, ItemFactoryAttributeHooks.header);
            itemHeader.setAttribute(GridAttributeHooks.itemDragAnchor, '');
            itemHeader.style.cursor = 'pointer';
            const classNames: string[] = [`grid-height-screen-${2}`, `grid-width-screen-${i + 1}`];
            item.classList.add(...classNames);
            grid.addItemWithClass(item);
        }
    }
}