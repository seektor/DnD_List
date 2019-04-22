import { AbstractGridDemo } from "../AbstractGridDemo";
import { Utils } from "../../../utils/Utils";
import { ContainerFactory } from "../../../Viewport/Factories/ContainerFactory/ContainerFactory";
import { Toolbox } from "../../../components/Toolbox/Toolbox";
import GridWithToolboxAttributeHooks from "./structures/GridWithToolboxAttributeHooks";
import { Grid } from "../../../components/Grid/Grid";
import { TGridParams } from "../../../components/Grid/structures/TGridParams";

export class GridWithToolboxDemo extends AbstractGridDemo {

    private gridParams: TGridParams = {
        columnCount: 12,
        columnGap: 30,
        rowGap: 30,
        minColumnWidth: 120,
        watchAnyResize: false,
        allowDynamicClassChange: true,
    }

    constructor(container: HTMLElement) {
        super();
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const demoTemplate: string = require("./grid-with-toolbox-demo.tpl.html");
        const demoElement: HTMLElement = Utils.createElementFromTemplate(demoTemplate);

        const toolboxSectionElement: HTMLElement = Utils.getElementByAttribute(demoElement, GridWithToolboxAttributeHooks.toolbox);
        const toolboxContainerElement: HTMLElement = ContainerFactory();
        const toolbox: Toolbox = new Toolbox(toolboxContainerElement);
        this.populateToolbox(toolbox);
        toolboxSectionElement.append(toolboxContainerElement);

        container.append(demoElement);

        const gridSectionElement: HTMLElement = Utils.getElementByAttribute(demoElement, GridWithToolboxAttributeHooks.grid);
        const gridContainerElement: HTMLElement = ContainerFactory();
        gridSectionElement.append(gridContainerElement);
        this.load1x1Scenario(gridContainerElement, 10);

    }

    private populateToolbox(toolbox: Toolbox): void {
        toolbox.addItem("Dark");
        toolbox.addItem("Inverted");
        toolbox.addItem("Image");
    }

    private load1x1Scenario(containerElement: HTMLElement, rowCount: number): void {
        const grid: Grid = new Grid(containerElement, containerElement, this.gridParams);
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            for (let columnIndex = 0; columnIndex < this.gridParams.columnCount; columnIndex++) {
                const item: HTMLElement = this.createClassItem(`[${rowIndex}, ${columnIndex}]`, gradientColors[columnIndex % gradientColors.length], 1, 1);
                grid.addItemWithClass(item);
            }
        }
    }
}