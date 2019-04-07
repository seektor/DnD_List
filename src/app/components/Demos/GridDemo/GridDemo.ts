import { Utils } from "../../../utils/Utils";
import { ContainerFactory } from "../../Viewport/Factories/ContainerFactory/ContainerFactory";
import { Grid } from "../../Grid/Grid";

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

        const grid: Grid = new Grid(containerElement);
    }
}