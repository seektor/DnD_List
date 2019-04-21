import { Utils } from "../../../utils/Utils";
import { Grid } from "../../../components/Grid/Grid";
import { TGridParams } from "../../../components/Grid/structures/TGridParams";
import { ContainerFactory } from "../../../Viewport/Factories/ContainerFactory/ContainerFactory";
import { AbstractGridDemo } from "../AbstractGridDemo";

export class GridDemo extends AbstractGridDemo {

    constructor(container: HTMLElement) {
        super();
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const demoTemplate: string = require("./grid-demo.tpl.html");
        const demoElement: HTMLElement = Utils.createElementFromTemplate(demoTemplate);
        const containerElement: HTMLElement = ContainerFactory();
        demoElement.append(containerElement);
        container.append(demoElement);

        // this.load1x1Scenario(containerElement, 2, 8);
        this.loadInterlacedScenario(containerElement, 20);
    }

    private load1x1Scenario(containerElement: HTMLElement, rowCount: number): void {
        const grid: Grid = new Grid(containerElement, this.gridParams);
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            for (let columnIndex = 0; columnIndex < this.gridParams.columnCount; columnIndex++) {
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