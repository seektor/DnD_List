import { Utils } from "../../../utils/Utils";
import { ContainerFactory } from "../../Viewport/Factories/ContainerFactory/ContainerFactory";
import { ItemFactory } from "../../Viewport/Factories/ItemFactory/ItemFactory";

export class GridDemo {

    constructor(container: HTMLElement) {
        this.construct(container);
    }

    private construct(container: HTMLElement): void {
        const gridTemplate: string = require("./grid-demo.tpl.html");
        const gridElement: HTMLElement = Utils.createElementFromTemplate(gridTemplate);
        const containerElement: HTMLElement = ContainerFactory();
        const color: string = Utils.getRandomColor();
        containerElement.append(ItemFactory(color));
        gridElement.append(containerElement);
        container.append(gridElement);
    }
}