import { Utils } from '../../../../common/utils/Utils';
import { Grid } from '../../../../Grid/Grid';
import { TGridParams } from '../../../../Grid/structures/TGridParams';
import { Toolbox } from '../../../components/Toolbox/Toolbox';
import { ContainerFactory } from '../../../Viewport/Factories/ContainerFactory/ContainerFactory';
import { AbstractGridDemo } from '../AbstractGridDemo';
import GridWithToolboxAttributeHooks from './structures/GridWithToolboxAttributeHooks';

export class GridWithToolboxDemo extends AbstractGridDemo {

    private gridParams: TGridParams = {
        columnCount: 12,
        columnGap: 30,
        rowGap: 30,
        watchAnyResize: false,
        minColumnWidth: 120,
        allowDynamicClassChange: true,
    }
    private grid: Grid;

    constructor(container: HTMLElement) {
        super();
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const demoTemplate: string = require('./grid-with-toolbox-demo.tpl.html');
        const demoElement: HTMLElement = Utils.createElementFromTemplate(demoTemplate);

        const toolboxSectionElement: HTMLElement = Utils.getElementByAttribute(demoElement, GridWithToolboxAttributeHooks.toolbox);
        const toolboxContainerElement: HTMLElement = ContainerFactory();
        const toolbox: Toolbox = new Toolbox(toolboxContainerElement);
        toolboxSectionElement.append(toolboxContainerElement);

        container.append(demoElement);

        const gridSectionElement: HTMLElement = Utils.getElementByAttribute(demoElement, GridWithToolboxAttributeHooks.grid);
        const gridContainerElement: HTMLElement = ContainerFactory();
        gridSectionElement.append(gridContainerElement);
        this.grid = this.loadDemoScenario(gridContainerElement);
        this.populateToolbox(toolbox, this.grid);
    }

    private populateToolbox(toolbox: Toolbox, grid: Grid): void {
        const darkItem: HTMLElement = this.createPureDarkItem('Toolbox');
        darkItem.classList.add(...this.createClassNames(1, 1));
        toolbox.addItem('Dark 1x1', darkItem, grid.getGridHandlers());
        const inputItem: HTMLElement = this.createItemWithInput();
        inputItem.classList.add(...this.createClassNames(2, 2));
        toolbox.addItem('Input 2x2', inputItem, grid.getGridHandlers());
    }

    private load1x1Scenario(containerElement: HTMLElement, rowCount: number): Grid {
        const grid: Grid = new Grid(containerElement, containerElement, this.gridParams);
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            for (let columnIndex = 0; columnIndex < this.gridParams.columnCount; columnIndex++) {
                const item: HTMLElement = this.createClassItem(`[${rowIndex}, ${columnIndex}]`, gradientColors[columnIndex % gradientColors.length], 1, 1);
                grid.addItemWithClass(item);
            }
        }
        return grid;
    }

    private loadDemoScenario(containerElement: HTMLElement): Grid {
        const grid: Grid = new Grid(containerElement, containerElement, this.gridParams);
        const gradientColors: string[][] = [...Utils.gradientColors.values()];
        const demoMap: number[][][] = [
            [[1, 1], [1, 2], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
            [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
            [[2, 1], [1, 1], [1, 1], [2, 2], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
            [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
            [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
            [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
            [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
            [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
            [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],
            [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]],

        ]
        for (let rowIndex = 0; rowIndex < demoMap.length; rowIndex++) {
            for (let columnIndex = 0; columnIndex < demoMap[0].length; columnIndex++) {
                const item: HTMLElement = this.createClassItem(`[${rowIndex}, ${columnIndex}]`, gradientColors[columnIndex % gradientColors.length], demoMap[rowIndex][columnIndex][0], demoMap[rowIndex][columnIndex][1]);
                grid.addItemWithClass(item);
            }
        }
        return grid;
    }
}